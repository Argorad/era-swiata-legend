using System.Security.Claims;
using Microsoft.AspNetCore.Builder;

namespace EraSwiataLegend.Api.Authorization;

public static class AuthContextHelpers
{
    public static bool IsAuthenticationEnabled(
        this IConfiguration configuration) =>
        configuration.GetValue<bool>("Authentication:Enabled");

    public static bool IsAuthenticatedUser(
        this HttpContext httpContext) =>
        httpContext.User.Identity?.IsAuthenticated == true;

    public static bool IsAdministrator(
        this ClaimsPrincipal principal) =>
        principal.IsInRole("Administrator");

    public static bool IsGameMasterOrAdministrator(
        this ClaimsPrincipal principal) =>
        principal.IsInRole("Administrator") ||
        principal.IsInRole("GameMaster");

    public static bool EffectivePlayerView(
        this HttpContext httpContext,
        IConfiguration configuration,
        bool requestedPlayerView = false) =>
        configuration.IsAuthenticationEnabled()
            ? httpContext.User.IsInRole("Player")
            : requestedPlayerView;

    public static RouteHandlerBuilder RequireAuthorizationIfEnabled(
        this RouteHandlerBuilder builder,
        IConfiguration configuration,
        string? policy = null)
    {
        if (!configuration.IsAuthenticationEnabled())
        {
            return builder;
        }

        return string.IsNullOrWhiteSpace(policy)
            ? builder.RequireAuthorization()
            : builder.RequireAuthorization(policy);
    }
}
