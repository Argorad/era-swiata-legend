using EraSwiataLegend.Application.Search;

namespace EraSwiataLegend.Api.Endpoints;

public static class SearchEndpoints
{
    public static IEndpointRouteBuilder MapSearchEndpoints(
        this IEndpointRouteBuilder app)
    {
        app.MapGet("/search",
            async (
                string query,
                Guid? worldId,
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
                    cancellationToken));
            })
            .WithTags("Search");

        return app;
    }
}
