using EraSwiataLegend.Api.Authentication;
using EraSwiataLegend.Api.Authorization;
using EraSwiataLegend.Domain.Enums;

namespace EraSwiataLegend.Api.Endpoints;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(
        this IEndpointRouteBuilder app,
        IConfiguration configuration)
    {
        var authEnabled = configuration.GetValue<bool>("Authentication:Enabled");

        app.MapGet("/auth/status", () =>
            Results.Ok(new
            {
                enabled = authEnabled,
                roles = new[]
                {
                    UserRole.Administrator.ToString(),
                    UserRole.GameMaster.ToString(),
                    UserRole.Player.ToString()
                },
                message = authEnabled
                    ? "Logowanie lokalne jest aktywne."
                    : "Logowanie pozostaje wyłączone, dopóki nie włączysz Authentication:Enabled."
            }))
            .WithTags("Auth")
            .AllowAnonymous();

        app.MapPost("/auth/login",
            async (
                LoginRequest request,
                HttpContext httpContext,
                LocalAuthService service,
                CancellationToken cancellationToken) =>
            {
                if (!authEnabled)
                {
                    return Results.Problem(
                        "Authentication is disabled.",
                        statusCode: StatusCodes.Status503ServiceUnavailable);
                }

                if (string.IsNullOrWhiteSpace(request.Login) ||
                    string.IsNullOrWhiteSpace(request.Password))
                {
                    return Results.ValidationProblem(
                        new Dictionary<string, string[]>
                        {
                            ["login"] = ["Podaj login lub e-mail i hasło."],
                            ["password"] = ["Podaj hasło."]
                        });
                }

                var result = await service.LoginAsync(
                    request with
                    {
                        Login = request.Login.Trim()
                    },
                    httpContext,
                    cancellationToken);

                return result.Error switch
                {
                    null => Results.Ok(result.Value),
                    _ => Results.Unauthorized(),
                };
            })
            .WithTags("Auth")
            .RequireRateLimiting("auth-login")
            .AllowAnonymous();

        app.MapGet("/auth/me",
            async (
                HttpContext httpContext,
                LocalAuthService service,
                CancellationToken cancellationToken) =>
            {
                if (!authEnabled)
                {
                    return Results.Ok(new
                    {
                        enabled = false,
                        user = (AuthSessionDto?)null
                    });
                }

                var user = await service.GetCurrentUserAsync(
                    httpContext.User,
                    cancellationToken);

                return Results.Ok(new
                {
                    enabled = true,
                    user
                });
            })
            .WithTags("Auth")
            .AllowAnonymous();

        app.MapPost("/auth/logout",
            async (
                HttpContext httpContext,
                LocalAuthService service) =>
            {
                if (authEnabled)
                {
                    await service.LogoutAsync(httpContext);
                }

                return Results.NoContent();
            })
            .WithTags("Auth")
            .AllowAnonymous();

        app.MapPost("/auth/change-password",
            async (
                ChangePasswordRequest request,
                HttpContext httpContext,
                LocalAuthService service,
                CancellationToken cancellationToken) =>
            {
                if (!authEnabled)
                {
                    return Results.Problem(
                        "Authentication is disabled.",
                        statusCode: StatusCodes.Status503ServiceUnavailable);
                }

                if (string.IsNullOrWhiteSpace(request.CurrentPassword) ||
                    string.IsNullOrWhiteSpace(request.NewPassword) ||
                    request.NewPassword.Length < 8)
                {
                    return Results.ValidationProblem(
                        new Dictionary<string, string[]>
                        {
                            ["currentPassword"] = ["Podaj obecne hasło."],
                            ["newPassword"] = ["Nowe hasło musi mieć co najmniej 8 znaków."]
                        });
                }

                var result = await service.ChangePasswordAsync(
                    httpContext.User,
                    request,
                    httpContext,
                    cancellationToken);

                return result.Error switch
                {
                    null => Results.Ok(result.Value),
                    "NotAuthenticated" => Results.Unauthorized(),
                    "InvalidCurrentPassword" => Results.BadRequest(
                        new { message = "Obecne hasło jest nieprawidłowe." }),
                    _ => Results.BadRequest(
                        new { message = "Nie udało się zmienić hasła." })
                };
            })
            .WithTags("Auth");

        return app;
    }
}
