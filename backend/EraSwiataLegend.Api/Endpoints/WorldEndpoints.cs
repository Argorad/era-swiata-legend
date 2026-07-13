using EraSwiataLegend.Application.Worlds.Commands;
using EraSwiataLegend.Application.Worlds.DTOs;
using EraSwiataLegend.Application.Worlds.Handlers;
using EraSwiataLegend.Domain.Enums;

namespace EraSwiataLegend.Api.Endpoints;

public static class WorldEndpoints
{
    public static IEndpointRouteBuilder MapWorldEndpoints(
        this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/worlds")
            .WithTags("Worlds");

        group.MapGet("/",
            async (
                GetWorldsQueryHandler handler,
                CancellationToken cancellationToken) =>
            {
                var result = await handler.HandleAsync(
                    cancellationToken);

                return Results.Ok(result);
            })
            .Produces<List<WorldDto>>(
                StatusCodes.Status200OK);

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
                            ["name"] =
                            [
                                "Nazwa świata jest wymagana."
                            ]
                        });
                }

                var command = new CreateWorldCommand(
                    request.Name.Trim(),
                    request.Description?.Trim());

                var result = await handler.HandleAsync(
                    command,
                    cancellationToken);

                return Results.Created(
                    $"/worlds/{result.Id}",
                    result);
            })
            .Produces<WorldDto>(
                StatusCodes.Status201Created)
            .ProducesValidationProblem(
                StatusCodes.Status400BadRequest);

        group.MapPatch("/{worldId:guid}/archive",
            async (
                Guid worldId,
                SetWorldStatusCommandHandler handler,
                CancellationToken cancellationToken) =>
            {
                var command = new SetWorldStatusCommand(
                    worldId,
                    WorldStatus.Archived);

                var result = await handler.HandleAsync(
                    command,
                    cancellationToken);

                if (result is null)
                {
                    return Results.NotFound();
                }

                return Results.Ok(result);
            })
            .Produces<WorldDto>(
                StatusCodes.Status200OK)
            .Produces(
                StatusCodes.Status404NotFound);

        group.MapPatch("/{worldId:guid}/restore",
            async (
                Guid worldId,
                SetWorldStatusCommandHandler handler,
                CancellationToken cancellationToken) =>
            {
                var command = new SetWorldStatusCommand(
                    worldId,
                    WorldStatus.Active);

                var result = await handler.HandleAsync(
                    command,
                    cancellationToken);

                if (result is null)
                {
                    return Results.NotFound();
                }

                return Results.Ok(result);
            })
            .Produces<WorldDto>(
                StatusCodes.Status200OK)
            .Produces(
                StatusCodes.Status404NotFound);

        return app;
    }
}