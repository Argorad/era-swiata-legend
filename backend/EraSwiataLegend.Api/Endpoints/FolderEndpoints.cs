using EraSwiataLegend.Application.Folders.Commands;
using EraSwiataLegend.Application.Folders.DTOs;
using EraSwiataLegend.Application.Folders.Handlers;

namespace EraSwiataLegend.Api.Endpoints;

public static class FolderEndpoints
{
    public static IEndpointRouteBuilder MapFolderEndpoints(
        this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/worlds/{worldId:guid}/folders")
            .WithTags("Folders");

        group.MapGet("/",
            async (
                Guid worldId,
                bool playerView,
                GetFoldersQueryHandler handler,
                CancellationToken cancellationToken) =>
            {
                var folders = await handler.HandleAsync(
                    worldId,
                    playerView,
                    cancellationToken);

                return Results.Ok(folders);
            })
            .Produces<List<FolderDto>>(StatusCodes.Status200OK);

        group.MapPost("/",
            async (
                Guid worldId,
                CreateFolderRequest request,
                CreateFolderCommandHandler handler,
                CancellationToken cancellationToken) =>
            {
                if (string.IsNullOrWhiteSpace(request.Name))
                {
                    return Results.ValidationProblem(
                        new Dictionary<string, string[]>
                        {
                            ["name"] = ["Nazwa folderu jest wymagana."]
                        });
                }

                var command = new CreateFolderCommand(
                    worldId,
                    request.Name.Trim(),
                    request.ParentFolderId);

                var result = await handler.HandleAsync(
                    command,
                    cancellationToken);

                if (result.Error == "WorldNotFound")
                {
                    return Results.NotFound(
                        new
                        {
                            message = "Nie znaleziono świata."
                        });
                }

                if (result.Error == "ParentFolderNotFound")
                {
                    return Results.BadRequest(
                        new
                        {
                            message =
                                "Folder nadrzędny nie istnieje albo należy do innego świata."
                        });
                }

                return Results.Created(
                    $"/worlds/{worldId}/folders/{result.Folder!.Id}",
                    result.Folder);
            })
            .Produces<FolderDto>(StatusCodes.Status201Created)
            .ProducesValidationProblem(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status404NotFound);

        group.MapPut("/{folderId:guid}",
            async (
                Guid worldId,
                Guid folderId,
                RenameFolderRequest request,
                RenameFolderCommandHandler handler,
                CancellationToken cancellationToken) =>
            {
                if (string.IsNullOrWhiteSpace(request.Name))
                {
                    return Results.ValidationProblem(
                        new Dictionary<string, string[]>
                        {
                            ["name"] = ["Nazwa folderu jest wymagana."]
                        });
                }

                var command = new RenameFolderCommand(
                    worldId,
                    folderId,
                    request.Name.Trim());

                var result = await handler.HandleAsync(
                    command,
                    cancellationToken);

                if (result.Error == "FolderNotFound")
                {
                    return Results.NotFound(
                        new
                        {
                            message = "Nie znaleziono folderu."
                        });
                }

                if (result.Error == "SystemFolderCannotBeRenamed")
                {
                    return Results.BadRequest(
                        new
                        {
                            message =
                                "Nie można zmienić nazwy folderu systemowego."
                        });
                }

                return Results.Ok(result.Folder);
            })
            .Produces<FolderDto>(StatusCodes.Status200OK)
            .ProducesValidationProblem(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status404NotFound);

        group.MapPatch("/{folderId:guid}/move",
            async (
                Guid worldId,
                Guid folderId,
                MoveFolderRequest request,
                MoveFolderCommandHandler handler,
                CancellationToken cancellationToken) =>
            {
                var command = new MoveFolderCommand(
                    worldId,
                    folderId,
                    request.DestinationFolderId);

                var result = await handler.HandleAsync(
                    command,
                    cancellationToken);

                return result.Error switch
                {
                    "FolderNotFound" => Results.NotFound(
                        new
                        {
                            message = "Nie znaleziono folderu."
                        }),

                    "DestinationFolderNotFound" => Results.BadRequest(
                        new
                        {
                            message =
                                "Nie znaleziono folderu docelowego."
                        }),

                    "SystemFolderCannotBeMoved" => Results.BadRequest(
                        new
                        {
                            message =
                                "Nie można przenosić folderu systemowego."
                        }),

                    "CannotMoveToSelf" => Results.BadRequest(
                        new
                        {
                            message =
                                "Folder nie może zostać przeniesiony do samego siebie."
                        }),

                    "CannotMoveToDescendant" => Results.BadRequest(
                        new
                        {
                            message =
                                "Folder nie może zostać przeniesiony do własnego podfolderu."
                        }),

                    _ => Results.Ok(result.Folder)
                };
            })
            .Produces<FolderDto>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status404NotFound);

        return app;
    }
}
