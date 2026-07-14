using EraSwiataLegend.Domain.Common;
using EraSwiataLegend.Domain.Enums;

namespace EraSwiataLegend.Domain.Entities;

public class UserAccount : BaseEntity
{
    public string ExternalSubject { get; set; } = string.Empty;

    public string DisplayName { get; set; } = string.Empty;

    public string? Email { get; set; }

    public string? NormalizedEmail { get; set; }

    public string? NormalizedDisplayName { get; set; }

    public string PasswordHash { get; set; } = string.Empty;

    public string SecurityStamp { get; set; } = string.Empty;

    public UserRole Role { get; set; } = UserRole.Player;

    public bool IsActive { get; set; } = true;

    public bool MustChangePassword { get; set; }

    public void UpdateIdentity(string displayName, string? email)
    {
        DisplayName = displayName.Trim();
        NormalizedDisplayName = Normalize(DisplayName);
        ExternalSubject = NormalizedDisplayName;
        Email = string.IsNullOrWhiteSpace(email)
            ? null
            : email.Trim();
        NormalizedEmail = string.IsNullOrWhiteSpace(email)
            ? null
            : Normalize(email);
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetRole(UserRole role)
    {
        Role = role;
        TouchSecurityStamp();
    }

    public void SetActive(bool isActive)
    {
        IsActive = isActive;
        TouchSecurityStamp();
    }

    public void SetPasswordHash(
        string passwordHash,
        bool mustChangePassword)
    {
        PasswordHash = passwordHash;
        MustChangePassword = mustChangePassword;
        TouchSecurityStamp();
    }

    public void RequirePasswordChange(bool mustChangePassword)
    {
        MustChangePassword = mustChangePassword;
        TouchSecurityStamp();
    }

    public void TouchSecurityStamp()
    {
        SecurityStamp = Guid.NewGuid().ToString("N");
        UpdatedAt = DateTime.UtcNow;
    }

    private static string Normalize(string value) =>
        value.Trim().ToUpperInvariant();
}
