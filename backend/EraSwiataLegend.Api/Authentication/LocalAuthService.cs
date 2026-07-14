using System.Security.Claims;
using EraSwiataLegend.Application.Interfaces;
using EraSwiataLegend.Domain.Entities;
using EraSwiataLegend.Domain.Enums;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace EraSwiataLegend.Api.Authentication;

public sealed class LocalAuthService
{
    private readonly IApplicationDbContext _dbContext;
    private readonly PasswordHasher<UserAccount> _passwordHasher;

    public LocalAuthService(
        IApplicationDbContext dbContext,
        PasswordHasher<UserAccount> passwordHasher)
    {
        _dbContext = dbContext;
        _passwordHasher = passwordHasher;
    }

    public async Task<AuthOperationResult<AuthSessionDto>> LoginAsync(
        LoginRequest request,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        var user = await FindByLoginAsync(request.Login, cancellationToken);

        if (user is null ||
            !user.IsActive ||
            string.IsNullOrWhiteSpace(user.PasswordHash))
        {
            return new(null, "InvalidCredentials");
        }

        var verification = _passwordHasher.VerifyHashedPassword(
            user,
            user.PasswordHash,
            request.Password);

        if (verification == PasswordVerificationResult.Failed)
        {
            return new(null, "InvalidCredentials");
        }

        if (verification == PasswordVerificationResult.SuccessRehashNeeded)
        {
            user.SetPasswordHash(
                _passwordHasher.HashPassword(user, request.Password),
                user.MustChangePassword);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        await SignInAsync(httpContext, user, cancellationToken);
        return new(ToSession(user), null);
    }

    private async Task<UserAccount?> FindByLoginAsync(
        string login,
        CancellationToken cancellationToken)
    {
        var normalizedLogin = Normalize(login);

        return await _dbContext.UserAccounts
            .FirstOrDefaultAsync(
                user =>
                    user.ExternalSubject == normalizedLogin ||
                    user.NormalizedDisplayName == normalizedLogin ||
                    user.NormalizedEmail == normalizedLogin,
                cancellationToken);
    }

    public async Task<AuthSessionDto?> GetCurrentUserAsync(
        ClaimsPrincipal principal,
        CancellationToken cancellationToken)
    {
        var user = await ValidatePrincipalAsync(
            principal,
            cancellationToken);

        return user is null ? null : ToSession(user);
    }

    public async Task<bool> LogoutAsync(HttpContext httpContext)
    {
        await httpContext.SignOutAsync(
            CookieAuthenticationDefaults.AuthenticationScheme);
        return true;
    }

    public async Task<AuthOperationResult<AuthSessionDto>> ChangePasswordAsync(
        ClaimsPrincipal principal,
        ChangePasswordRequest request,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        var user = await ValidatePrincipalAsync(
            principal,
            cancellationToken);

        if (user is null)
        {
            return new(null, "NotAuthenticated");
        }

        var verification = _passwordHasher.VerifyHashedPassword(
            user,
            user.PasswordHash,
            request.CurrentPassword);

        if (verification == PasswordVerificationResult.Failed)
        {
            return new(null, "InvalidCurrentPassword");
        }

        user.SetPasswordHash(
            _passwordHasher.HashPassword(user, request.NewPassword),
            mustChangePassword: false);
        await _dbContext.SaveChangesAsync(cancellationToken);
        await SignInAsync(httpContext, user, cancellationToken);

        return new(ToSession(user), null);
    }

    public async Task<List<UserAdminDto>> GetUsersAsync(
        CancellationToken cancellationToken)
    {
        return await _dbContext.UserAccounts
            .AsNoTracking()
            .OrderBy(user => user.Role)
            .ThenBy(user => user.DisplayName)
            .Select(user => new UserAdminDto(
                user.Id,
                user.DisplayName,
                user.Email,
                user.Role,
                user.IsActive,
                user.MustChangePassword,
                user.CreatedAt,
                user.UpdatedAt))
            .ToListAsync(cancellationToken);
    }

    public async Task<AuthOperationResult<UserAdminDto>> CreateUserAsync(
        CreateUserRequest request,
        CancellationToken cancellationToken)
    {
        var validationError = await ValidateUserAsync(
            null,
            request.DisplayName,
            request.Email,
            request.Password,
            requirePassword: true,
            cancellationToken);

        if (validationError is not null)
        {
            return new(null, validationError);
        }

        var user = new UserAccount();
        user.UpdateIdentity(request.DisplayName, request.Email);
        user.SetRole(request.Role);
        user.SetActive(request.IsActive);
        user.SetPasswordHash(
            _passwordHasher.HashPassword(user, request.Password),
            request.MustChangePassword);

        _dbContext.UserAccounts.Add(user);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new(ToAdmin(user), null);
    }

    public async Task<AuthOperationResult<UserAdminDto>> UpdateUserAsync(
        Guid userId,
        UpdateUserRequest request,
        CancellationToken cancellationToken)
    {
        var user = await _dbContext.UserAccounts
            .FirstOrDefaultAsync(item => item.Id == userId, cancellationToken);

        if (user is null)
        {
            return new(null, "UserNotFound");
        }

        var validationError = await ValidateUserAsync(
            userId,
            request.DisplayName,
            request.Email,
            request.Password,
            requirePassword: false,
            cancellationToken);

        if (validationError is not null)
        {
            return new(null, validationError);
        }

        user.UpdateIdentity(request.DisplayName, request.Email);
        user.SetRole(request.Role);
        user.SetActive(request.IsActive);
        user.RequirePasswordChange(request.MustChangePassword);

        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            user.SetPasswordHash(
                _passwordHasher.HashPassword(user, request.Password),
                request.MustChangePassword);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        return new(ToAdmin(user), null);
    }

    public async Task<AuthOperationResult<UserAdminDto>> SetPasswordResetFlagAsync(
        Guid userId,
        bool mustChangePassword,
        CancellationToken cancellationToken)
    {
        var user = await _dbContext.UserAccounts
            .FirstOrDefaultAsync(item => item.Id == userId, cancellationToken);

        if (user is null)
        {
            return new(null, "UserNotFound");
        }

        user.RequirePasswordChange(mustChangePassword);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return new(ToAdmin(user), null);
    }

    public async Task<bool> AnyAdministratorAsync(
        CancellationToken cancellationToken)
    {
        return await _dbContext.UserAccounts
            .AnyAsync(
                user =>
                    user.IsActive &&
                    user.Role == UserRole.Administrator,
                cancellationToken);
    }

    public async Task<UserAccount> CreateBootstrapAdministratorAsync(
        string login,
        string displayName,
        string password,
        string? email,
        bool mustChangePassword,
        CancellationToken cancellationToken)
    {
        var user = new UserAccount();
        user.UpdateIdentity(displayName, email);
        user.SetRole(UserRole.Administrator);
        user.SetActive(true);
        user.SetPasswordHash(
            _passwordHasher.HashPassword(user, password),
            mustChangePassword);
        user.ExternalSubject = Normalize(login);
        if (string.IsNullOrWhiteSpace(user.SecurityStamp))
        {
            user.TouchSecurityStamp();
        }

        _dbContext.UserAccounts.Add(user);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return user;
    }

    public async Task<UserAccount?> ValidatePrincipalAsync(
        ClaimsPrincipal principal,
        CancellationToken cancellationToken)
    {
        var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        var securityStamp = principal.FindFirstValue("security_stamp");

        if (!Guid.TryParse(userId, out var parsedId) ||
            string.IsNullOrWhiteSpace(securityStamp))
        {
            return null;
        }

        var user = await _dbContext.UserAccounts
            .FirstOrDefaultAsync(item => item.Id == parsedId, cancellationToken);

        if (user is null ||
            !user.IsActive ||
            !string.Equals(user.SecurityStamp, securityStamp, StringComparison.Ordinal))
        {
            return null;
        }

        return user;
    }

    private async Task<string?> ValidateUserAsync(
        Guid? userId,
        string displayName,
        string? email,
        string? password,
        bool requirePassword,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(displayName) ||
            displayName.Trim().Length > 200 ||
            !string.IsNullOrWhiteSpace(email) &&
                email.Trim().Length > 320 ||
            (requirePassword && string.IsNullOrWhiteSpace(password)) ||
            (!string.IsNullOrWhiteSpace(password) && password.Length < 8))
        {
            return "InvalidUser";
        }

        var normalizedDisplayName = Normalize(displayName);
        var normalizedEmail = string.IsNullOrWhiteSpace(email)
            ? null
            : Normalize(email);

        var duplicateName = await _dbContext.UserAccounts.AnyAsync(
            user =>
                user.Id != userId &&
                user.NormalizedDisplayName == normalizedDisplayName,
            cancellationToken);

        if (duplicateName)
        {
            return "DuplicateDisplayName";
        }

        if (normalizedEmail is not null)
        {
            var duplicateEmail = await _dbContext.UserAccounts.AnyAsync(
                user =>
                    user.Id != userId &&
                    user.NormalizedEmail == normalizedEmail,
                cancellationToken);

            if (duplicateEmail)
            {
                return "DuplicateEmail";
            }
        }

        return null;
    }

    private async Task SignInAsync(
        HttpContext httpContext,
        UserAccount user,
        CancellationToken cancellationToken)
    {
        var identity = new ClaimsIdentity(
            CookieAuthenticationDefaults.AuthenticationScheme,
            ClaimTypes.Name,
            ClaimTypes.Role);

        identity.AddClaim(new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()));
        identity.AddClaim(new Claim(ClaimTypes.Name, user.DisplayName));
        identity.AddClaim(new Claim(ClaimTypes.Role, user.Role.ToString()));
        identity.AddClaim(new Claim("security_stamp", user.SecurityStamp));
        if (!string.IsNullOrWhiteSpace(user.Email))
        {
            identity.AddClaim(new Claim(ClaimTypes.Email, user.Email));
        }

        var principal = new ClaimsPrincipal(identity);
        await httpContext.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            principal,
            new AuthenticationProperties
            {
                IsPersistent = false,
                AllowRefresh = true
            });
    }

    private static AuthSessionDto ToSession(UserAccount user) =>
        new(
            user.Id,
            user.DisplayName,
            user.Email,
            user.Role,
            user.MustChangePassword);

    private static UserAdminDto ToAdmin(UserAccount user) =>
        new(
            user.Id,
            user.DisplayName,
            user.Email,
            user.Role,
            user.IsActive,
            user.MustChangePassword,
            user.CreatedAt,
            user.UpdatedAt);

    private static string Normalize(string value) =>
        value.Trim().ToUpperInvariant();
}
