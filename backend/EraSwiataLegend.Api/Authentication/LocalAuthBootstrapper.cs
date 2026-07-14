using EraSwiataLegend.Domain.Entities;
using EraSwiataLegend.Domain.Enums;

namespace EraSwiataLegend.Api.Authentication;

public sealed class LocalAuthBootstrapper
{
    private readonly IConfiguration _configuration;
    private readonly LocalAuthService _authService;
    private readonly ILogger<LocalAuthBootstrapper> _logger;

    public LocalAuthBootstrapper(
        IConfiguration configuration,
        LocalAuthService authService,
        ILogger<LocalAuthBootstrapper> logger)
    {
        _configuration = configuration;
        _authService = authService;
        _logger = logger;
    }

    public async Task EnsureBootstrapAdministratorAsync(
        CancellationToken cancellationToken)
    {
        if (await _authService.AnyAdministratorAsync(cancellationToken))
        {
            return;
        }

        var login = _configuration["BootstrapAdmin:Login"]
            ?? Environment.GetEnvironmentVariable("BootstrapAdmin__Login");
        var displayName = _configuration["BootstrapAdmin:DisplayName"]
            ?? Environment.GetEnvironmentVariable("BootstrapAdmin__DisplayName");
        var password = _configuration["BootstrapAdmin:Password"]
            ?? Environment.GetEnvironmentVariable("BootstrapAdmin__Password");
        var email = _configuration["BootstrapAdmin:Email"]
            ?? Environment.GetEnvironmentVariable("BootstrapAdmin__Email");
        var mustChangePassword = _configuration.GetValue<bool?>(
                "BootstrapAdmin:MustChangePassword")
            ?? (bool.TryParse(
                    Environment.GetEnvironmentVariable(
                        "BootstrapAdmin__MustChangePassword"),
                    out var parsedMustChangePassword)
                ? parsedMustChangePassword
                : true);

        if (string.IsNullOrWhiteSpace(login) ||
            string.IsNullOrWhiteSpace(displayName) ||
            string.IsNullOrWhiteSpace(password))
        {
            throw new InvalidOperationException(
                "Authentication is enabled, but the first Administrator bootstrap is missing. Set BootstrapAdmin__Login, BootstrapAdmin__DisplayName and BootstrapAdmin__Password.");
        }

        var user = await _authService.CreateBootstrapAdministratorAsync(
            login.Trim(),
            displayName.Trim(),
            password,
            string.IsNullOrWhiteSpace(email) ? null : email.Trim(),
            mustChangePassword,
            cancellationToken);

        _logger.LogInformation(
            "Utworzono bootstrapowego Administratora '{DisplayName}' ({UserId}).",
            user.DisplayName,
            user.Id);
    }
}
