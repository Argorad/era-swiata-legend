using EraSwiataLegend.Application.Pages.Commands;
using EraSwiataLegend.Application.Pages.DTOs;
using EraSwiataLegend.Application.Pages.Handlers;

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
                if (string.IsNullOrWhiteSpace(request.Title))
                {
                    return Results.ValidationProblem(
                        new Dictionary<string, string[]>
                        {
                            ["title"] = ["Tytuł strony jest wymagany."]
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

                return Results.Created(
                    $"/pages/{result.Page!.Id}",
                    result.Page);
            })
            .Produces<PageDto>(StatusCodes.Status201Created)
            .ProducesValidationProblem(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status404NotFound);

        return app;
    }
}