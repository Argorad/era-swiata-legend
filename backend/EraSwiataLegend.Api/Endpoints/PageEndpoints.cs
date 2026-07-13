using EraSwiataLegend.Application.Pages.Commands;
using EraSwiataLegend.Application.Pages.DTOs;
using EraSwiataLegend.Application.Pages.Handlers;
using EraSwiataLegend.Domain.Enums;

namespace EraSwiataLegend.Api.Endpoints;

public static class PageEndpoints
{
    public static IEndpointRouteBuilder MapPageEndpoints(
        this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup(
                "/worlds/{worldId:guid}/folders/{folderId:guid}/pages")
            .WithTags("Pages");

        group.MapGet("/",
            async (
                Guid worldId,
                Guid folderId,
                GetPagesQueryHandler handler,
                CancellationToken cancellationToken) =>
            {
                var pages = await handler.HandleAsync(
                    worldId,
                    folderId,
                    cancellationToken);

                return Results.Ok(pages);
            })
            .Produces<List<PageDto>>(StatusCodes.Status200OK);

        group.MapPost("/",
            async (
                Guid worldId,
                Guid folderId,
                CreatePageRequest request,
                CreatePageCommandHandler handler,
                CancellationToken cancellationToken) =>
            {
                if (string.IsNullOrWhiteSpace(request.Title) ||
                    request.Title.Trim().Length > 300)
                {
                    return Results.ValidationProblem(
                        new Dictionary<string, string[]>
                        {
                            ["title"] =
                            [
                                "Tytuł jest wymagany i może mieć maksymalnie 300 znaków."
                            ]
                        });
                }

                var command = new CreatePageCommand(
                    worldId,
                    folderId,
                    request.Title.Trim(),
                    request.Content?.Trim());

                var result = await handler.HandleAsync(
                    command,
                    cancellationToken);

                if (result.Error == "FolderNotFound")
                {
                    return Results.NotFound(
                        new
                        {
                            message =
                                "Folder nie istnieje albo należy do innego świata."
                        });
                }

                if (result.Error == "SystemFolderCannotContainNewPage")
                {
                    return Results.BadRequest(
                        new
                        {
                            message =
                                "Nowe strony można tworzyć wyłącznie w zwykłych folderach."
                        });
                }

                return Results.Created(
                    $"/pages/{result.Page!.Id}",
                    result.Page);
            })
            .Produces<PageDto>(StatusCodes.Status201Created)
            .ProducesValidationProblem(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status404NotFound);

        var pageGroup = app.MapGroup(
                "/worlds/{worldId:guid}/pages/{pageId:guid}")
            .WithTags("Pages");

        pageGroup.MapPut("/",
            async (
                Guid worldId,
                Guid pageId,
                UpdatePageRequest request,
                PageManagementService service,
                CancellationToken cancellationToken) =>
            {
                if (string.IsNullOrWhiteSpace(request.Title) ||
                    request.Title.Trim().Length > 300)
                {
                    return Results.ValidationProblem(
                        new Dictionary<string, string[]>
                        {
                            ["title"] =
                            [
                                "Tytuł jest wymagany i może mieć maksymalnie 300 znaków."
                            ]
                        });
                }

                var result = await service.UpdateAsync(
                    worldId,
                    pageId,
                    request.Title,
                    request.Content ?? string.Empty,
                    cancellationToken);

                return PageResult(result);
            });

        pageGroup.MapPatch("/move",
            async (
                Guid worldId,
                Guid pageId,
                MovePageRequest request,
                PageManagementService service,
                CancellationToken cancellationToken) =>
                PageResult(await service.MoveAsync(
                    worldId,
                    pageId,
                    request.DestinationFolderId,
                    cancellationToken)));

        pageGroup.MapPatch("/archive",
            async (
                Guid worldId,
                Guid pageId,
                PageManagementService service,
                CancellationToken cancellationToken) =>
                PageResult(await service.MoveToSystemFolderAsync(
                    worldId,
                    pageId,
                    FolderType.Archive,
                    cancellationToken)));

        pageGroup.MapPatch("/trash",
            async (
                Guid worldId,
                Guid pageId,
                PageManagementService service,
                CancellationToken cancellationToken) =>
                PageResult(await service.MoveToSystemFolderAsync(
                    worldId,
                    pageId,
                    FolderType.Trash,
                    cancellationToken)));

        pageGroup.MapPatch("/restore",
            async (
                Guid worldId,
                Guid pageId,
                RestorePageRequest request,
                PageManagementService service,
                CancellationToken cancellationToken) =>
                PageResult(await service.RestoreAsync(
                    worldId,
                    pageId,
                    request.DestinationFolderId,
                    cancellationToken)));

        pageGroup.MapDelete("/",
            async (
                Guid worldId,
                Guid pageId,
                PageManagementService service,
                CancellationToken cancellationToken) =>
            {
                var error = await service.DeletePermanentlyAsync(
                    worldId,
                    pageId,
                    cancellationToken);

                return error switch
                {
                    null => Results.NoContent(),
                    "PageNotFound" => Results.NotFound(
                        new { message = "Nie znaleziono strony." }),
                    _ => Results.BadRequest(
                        new
                        {
                            message =
                                "Trwale usunąć można wyłącznie stronę znajdującą się w koszu."
                        })
                };
            });

        return app;
    }

    private static IResult PageResult(PageOperationResult result)
    {
        return result.Error switch
        {
            null => Results.Ok(result.Page),
            "PageNotFound" => Results.NotFound(
                new { message = "Nie znaleziono strony." }),
            "DestinationFolderNotFound" => Results.BadRequest(
                new { message = "Folder docelowy nie istnieje." }),
            "SystemFolderNotFound" => Results.Problem(
                "Brakuje folderu systemowego świata.",
                statusCode: StatusCodes.Status409Conflict),
            "PageIsNotArchived" => Results.BadRequest(
                new { message = "Strona nie wymaga przywrócenia." }),
            "RestoreDestinationNotFound" => Results.BadRequest(
                new
                {
                    message =
                        "Nie znaleziono bezpiecznego folderu docelowego do przywrócenia."
                }),
            _ => Results.BadRequest()
        };
    }
}
