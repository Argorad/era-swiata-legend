using EraSwiataLegend.Api.Authentication;
using EraSwiataLegend.Api.Authorization;

namespace EraSwiataLegend.Api.Endpoints;

public static class UserEndpoints
{
    public static IEndpointRouteBuilder MapUserEndpoints(
        this IEndpointRouteBuilder app,
        IConfiguration configuration)
    {
        var authEnabled = configuration.IsAuthenticationEnabled();
        var group = app.MapGroup("/users")
            .WithTags("Users");

        if (authEnabled)
        {
            group.RequireAuthorization(
                AuthorizationPolicies.Administrator);
        }

        group.MapGet("/",
            async (
                LocalAuthService service,
                CancellationToken cancellationToken) =>
            {
                if (!authEnabled)
                {
                    return Results.Problem(
                        "Authentication is disabled.",
                        statusCode: StatusCodes.Status503ServiceUnavailable);
                }

                return Results.Ok(await service.GetUsersAsync(
                    cancellationToken));
            });

        group.MapPost("/",
            async (
                CreateUserRequest request,
                LocalAuthService service,
                CancellationToken cancellationToken) =>
            {
                if (!authEnabled)
                {
                    return Results.Problem(
                        "Authentication is disabled.",
                        statusCode: StatusCodes.Status503ServiceUnavailable);
                }

                if (string.IsNullOrWhiteSpace(request.DisplayName) ||
                    string.IsNullOrWhiteSpace(request.Password))
                {
                    return Results.ValidationProblem(
                        new Dictionary<string, string[]>
                        {
                            ["displayName"] = ["Nazwa użytkownika jest wymagana."],
                            ["password"] = ["Hasło jest wymagane."]
                        });
                }

                var result = await service.CreateUserAsync(
                    request with
                    {
                        DisplayName = request.DisplayName.Trim(),
                        Email = string.IsNullOrWhiteSpace(request.Email)
                            ? null
                            : request.Email.Trim(),
                        Password = request.Password.Trim()
                    },
                    cancellationToken);

                return result.Error switch
                {
                    null => Results.Created($"/users/{result.Value!.Id}", result.Value),
                    "DuplicateDisplayName" => Results.Conflict(
                        new { message = "Taki nick już istnieje." }),
                    "DuplicateEmail" => Results.Conflict(
                        new { message = "Ten e-mail jest już zajęty." }),
                    _ => Results.BadRequest(
                        new { message = "Nie udało się utworzyć konta." })
                };
            });

        group.MapPut("/{userId:guid}",
            async (
                Guid userId,
                UpdateUserRequest request,
                LocalAuthService service,
                CancellationToken cancellationToken) =>
            {
                if (!authEnabled)
                {
                    return Results.Problem(
                        "Authentication is disabled.",
                        statusCode: StatusCodes.Status503ServiceUnavailable);
                }

                if (string.IsNullOrWhiteSpace(request.DisplayName))
                {
                    return Results.ValidationProblem(
                        new Dictionary<string, string[]>
                        {
                            ["displayName"] = ["Nazwa użytkownika jest wymagana."]
                        });
                }

                var result = await service.UpdateUserAsync(
                    userId,
                    request with
                    {
                        DisplayName = request.DisplayName.Trim(),
                        Email = string.IsNullOrWhiteSpace(request.Email)
                            ? null
                            : request.Email.Trim(),
                        Password = string.IsNullOrWhiteSpace(request.Password)
                            ? null
                            : request.Password.Trim()
                    },
                    cancellationToken);

                return result.Error switch
                {
                    null => Results.Ok(result.Value),
                    "UserNotFound" => Results.NotFound(),
                    "DuplicateDisplayName" => Results.Conflict(
                        new { message = "Taki nick już istnieje." }),
                    "DuplicateEmail" => Results.Conflict(
                        new { message = "Ten e-mail jest już zajęty." }),
                    _ => Results.BadRequest(
                        new { message = "Nie udało się zaktualizować konta." })
                };
            });

        group.MapPatch("/{userId:guid}/force-password-change",
            async (
                Guid userId,
                LocalAuthService service,
                CancellationToken cancellationToken) =>
            {
                if (!authEnabled)
                {
                    return Results.Problem(
                        "Authentication is disabled.",
                        statusCode: StatusCodes.Status503ServiceUnavailable);
                }

                var result = await service.SetPasswordResetFlagAsync(
                    userId,
                    true,
                    cancellationToken);

                return result.Error switch
                {
                    null => Results.Ok(result.Value),
                    "UserNotFound" => Results.NotFound(),
                    _ => Results.BadRequest()
                };
            });

        return app;
    }
}
