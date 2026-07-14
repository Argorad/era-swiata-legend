using EraSwiataLegend.Domain.Enums;

namespace EraSwiataLegend.Api.Authentication;

public sealed record LoginRequest(
    string Login,
    string Password);

public sealed record ChangePasswordRequest(
    string CurrentPassword,
    string NewPassword);

public sealed record CreateUserRequest(
    string DisplayName,
    string? Email,
    string Password,
    UserRole Role,
    bool IsActive,
    bool MustChangePassword);

public sealed record UpdateUserRequest(
    string DisplayName,
    string? Email,
    string? Password,
    UserRole Role,
    bool IsActive,
    bool MustChangePassword);

public sealed record AuthSessionDto(
    Guid Id,
    string DisplayName,
    string? Email,
    UserRole Role,
    bool MustChangePassword);

public sealed record UserAdminDto(
    Guid Id,
    string DisplayName,
    string? Email,
    UserRole Role,
    bool IsActive,
    bool MustChangePassword,
    DateTime CreatedAt,
    DateTime? UpdatedAt);

public sealed record AuthOperationResult<T>(
    T? Value,
    string? Error);
