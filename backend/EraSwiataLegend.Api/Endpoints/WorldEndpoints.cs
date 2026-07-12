using EraSwiataLegend.Application.Worlds.Commands;
using EraSwiataLegend.Application.Worlds.DTOs;
using EraSwiataLegend.Application.Worlds.Handlers;

namespace EraSwiataLegend.Api.Endpoints;

public static class WorldEndpoints
{
    public static IEndpointRouteBuilder MapWorldEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/worlds")
            .WithTags("Worlds");

        group.MapGet("/",
            async (
                GetWorldsQueryHandler handler,
                CancellationToken cancellationToken) =>
            {
                var result = await handler.HandleAsync(cancellationToken);

                return Results.Ok(result);
            })
            .Produces<List<WorldDto>>(StatusCodes.Status200OK);

        group.MapPost("/",
            async (
                CreateWorldRequest request,
                CreateWorldCommandHandler handler,
                CancellationToken cancellationToken) =>
            {
                if (string.IsNullOrWhiteSpace(request.Name))
                {
                    return Results.ValidationProblem(
                        new Dictionary<string, string[]>
                        {
                            ["name"] = ["Nazwa świata jest wymagana."]
                        });
                }

                var command = new CreateWorldCommand(
                    request.Name.Trim(),
                    request.Description?.Trim());

                var result = await handler.HandleAsync(
                    command,
                    cancellationToken);

                return Results.Created($"/worlds/{result.Id}", result);
            })
            .Produces<WorldDto>(StatusCodes.Status201Created)
            .ProducesValidationProblem(StatusCodes.Status400BadRequest);

        return app;
    }
}