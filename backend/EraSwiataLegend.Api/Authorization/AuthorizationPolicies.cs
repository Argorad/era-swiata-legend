namespace EraSwiataLegend.Api.Authorization;

public static class AuthorizationPolicies
{
    public const string Administrator = "Administrator";
    public const string GameMasterOrAdministrator =
        "GameMasterOrAdministrator";
    public const string AuthenticatedReader =
        "AuthenticatedReader";
}
