using EraSwiataLegend.Api.Authorization;
using EraSwiataLegend.Application.Search;

namespace EraSwiataLegend.Api.Endpoints;

public static class SearchEndpoints
{
    public static IEndpointRouteBuilder MapSearchEndpoints(
        this IEndpointRouteBuilder app,
        IConfiguration configuration)
    {
        var endpoint = app.MapGet("/search",
            async (
                string query,
                Guid? worldId,
                HttpContext httpContext,
                IConfiguration configuration,
                KnowledgeSearchService service,
                CancellationToken cancellationToken) =>
            {
                if (string.IsNullOrWhiteSpace(query) ||
                    query.Trim().Length < 2)
                {
                    return Results.ValidationProblem(
                        new Dictionary<string, string[]>
                        {
                            ["query"] =
                            [
                                "Wpisz co najmniej 2 znaki."
                            ]
                        });
                }

                return Results.Ok(await service.SearchAsync(
                    query,
                    worldId,
                    httpContext.EffectivePlayerView(configuration),
                    cancellationToken));
            })
            .WithTags("Search");

        if (configuration.IsAuthenticationEnabled())
        {
            endpoint.RequireAuthorization();
        }

        return app;
    }
}
