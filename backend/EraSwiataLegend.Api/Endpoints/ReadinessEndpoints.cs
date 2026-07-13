using EraSwiataLegend.Application.Interfaces;

namespace EraSwiataLegend.Api.Endpoints;

public static class ReadinessEndpoints
{
    public static IEndpointRouteBuilder MapReadinessEndpoints(
        this IEndpointRouteBuilder app,
        IConfiguration configuration)
    {
        app.MapGet("/auth/status", () =>
            Results.Ok(new
            {
                enabled = configuration.GetValue<bool>(
                    "Authentication:Enabled"),
                roles = new[]
                {
                    "Administrator",
                    "GameMaster",
                    "Player"
                },
                message =
                    "Logowanie pozostaje wyłączone do skonfigurowania bezpiecznego dostawcy tożsamości i pierwszego administratora."
            }))
            .WithTags("Readiness");

        app.MapGet("/ai/status", (IAiSearchProvider provider) =>
            Results.Ok(new
            {
                configured = provider.IsConfigured,
                message = provider.StatusMessage
            }))
            .WithTags("AI");

        app.MapPost("/ai/search",
            async (
                AiSearchRequest request,
                IAiSearchProvider provider,
                CancellationToken cancellationToken) =>
            {
                if (!provider.IsConfigured)
                {
                    return Results.Problem(
                        provider.StatusMessage,
                        statusCode:
                            StatusCodes.Status503ServiceUnavailable);
                }

                var answer = await provider.SearchAsync(
                    request.WorldId,
                    request.Question,
                    cancellationToken);

                return Results.Ok(answer);
            })
            .WithTags("AI");

        return app;
    }

    private sealed record AiSearchRequest(
        Guid? WorldId,
        string Question);
}
