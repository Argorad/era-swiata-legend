using EraSwiataLegend.Api.Authorization;
using EraSwiataLegend.Application.Files;

namespace EraSwiataLegend.Api.Endpoints;

public static class FileEndpoints
{
    public static IEndpointRouteBuilder MapFileEndpoints(
        this IEndpointRouteBuilder app,
        IConfiguration configuration)
    {
        var mapImages = app.MapGet("/worlds/{worldId:guid}/map-images",
            async (
                Guid worldId,
                HttpContext httpContext,
                IConfiguration configuration,
                FileLibraryService service,
                CancellationToken cancellationToken) =>
                Results.Ok(await service.GetMapImagesAsync(
                    worldId,
                    httpContext.EffectivePlayerView(configuration),
                    cancellationToken)))
            .WithTags("Files");

        if (configuration.IsAuthenticationEnabled())
        {
            mapImages.RequireAuthorization();
        }

        var folderGroup = app.MapGroup(
                "/worlds/{worldId:guid}/folders/{folderId:guid}/files")
            .WithTags("Files");

        if (configuration.IsAuthenticationEnabled())
        {
            folderGroup.RequireAuthorization();
        }

        folderGroup.MapGet("/",
            async (
                Guid worldId,
                Guid folderId,
                HttpContext httpContext,
                IConfiguration configuration,
                FileLibraryService service,
                CancellationToken cancellationToken) =>
                Results.Ok(await service.GetFilesAsync(
                    worldId,
                    folderId,
                    httpContext.EffectivePlayerView(configuration),
                    cancellationToken)));

        folderGroup.MapPost("/",
            async (
                Guid worldId,
                Guid folderId,
                HttpRequest request,
                FileLibraryService service,
                CancellationToken cancellationToken) =>
            {
                if (!request.HasFormContentType)
                {
                    return Results.BadRequest(
                        new { message = "Wymagany jest formularz z plikiem." });
                }

                var form = await request.ReadFormAsync(cancellationToken);
                var file = form.Files.GetFile("file");

                if (file is null)
                {
                    return Results.BadRequest(
                        new { message = "Nie wybrano pliku." });
                }

                await using var stream = file.OpenReadStream();

                var result = await service.UploadAsync(
                    worldId,
                    folderId,
                    file.FileName,
                    file.ContentType,
                    file.Length,
                    stream,
                    cancellationToken);

                return result.Error switch
                {
                    null => Results.Created(
                        $"/worlds/{worldId}/files/{result.File!.Id}",
                        result.File),
                    "FolderNotFound" => Results.NotFound(
                        new { message = "Nie znaleziono folderu." }),
                    "SystemFolderCannotContainNewFile" =>
                        Results.BadRequest(
                            new
                            {
                                message =
                                    "Nowe pliki można dodawać wyłącznie do zwykłych folderów."
                            }),
                    "InvalidFileSize" => Results.BadRequest(
                        new
                        {
                            message =
                                "Plik musi mieć od 1 bajta do 20 MB."
                        }),
                    "FileTypeNotAllowed" => Results.BadRequest(
                        new
                        {
                            message =
                                "Dozwolone typy: PDF, tekst, Markdown, obrazy, DOCX i XLSX."
                        }),
                    _ => Results.BadRequest(
                        new { message = "Nieprawidłowa nazwa pliku." })
                };
            })
            .RequireAuthorizationIfEnabled(
                configuration,
                AuthorizationPolicies.GameMasterOrAdministrator);

        folderGroup.MapPost("/map-image",
            async (
                Guid worldId,
                Guid folderId,
                HttpRequest request,
                FileLibraryService service,
                CancellationToken cancellationToken) =>
            {
                if (!request.HasFormContentType)
                {
                    return Results.BadRequest(
                        new { message = "Wymagany jest formularz z obrazem mapy." });
                }

                var form = await request.ReadFormAsync(cancellationToken);
                var file = form.Files.GetFile("file");

                if (file is null)
                {
                    return Results.BadRequest(
                        new { message = "Nie wybrano obrazu mapy." });
                }

                await using var stream = file.OpenReadStream();
                var result = await service.UploadMapImageAsync(
                    worldId,
                    folderId,
                    file.FileName,
                    file.Length,
                    stream,
                    cancellationToken);

                return result.Error switch
                {
                    null => Results.Created(
                        $"/worlds/{worldId}/files/{result.File!.Id}",
                        result.File),
                    "FolderNotFound" => Results.NotFound(
                        new { message = "Nie znaleziono folderu." }),
                    "SystemFolderCannotContainNewFile" => Results.BadRequest(
                        new
                        {
                            message =
                                "Obraz mapy można zapisać wyłącznie w zwykłym folderze."
                        }),
                    "InvalidFileSize" => Results.BadRequest(
                        new
                        {
                            message =
                                "Obraz mapy może mieć maksymalnie 50 MB."
                        }),
                    "FileTypeNotAllowed" => Results.BadRequest(
                        new
                        {
                            message =
                                "Dozwolone obrazy map: PNG, JPG/JPEG, WebP i AVIF z poprawną sygnaturą pliku."
                        }),
                    _ => Results.BadRequest(
                        new { message = "Nieprawidłowa nazwa obrazu mapy." })
                };
            })
            .RequireAuthorizationIfEnabled(
                configuration,
                AuthorizationPolicies.GameMasterOrAdministrator);

        var fileGroup = app.MapGroup(
                "/worlds/{worldId:guid}/files/{fileId:guid}")
            .WithTags("Files");

        if (configuration.IsAuthenticationEnabled())
        {
            fileGroup.RequireAuthorization();
        }

        fileGroup.MapGet("/download",
            async (
                Guid worldId,
                Guid fileId,
                HttpContext httpContext,
                IConfiguration configuration,
                FileLibraryService service,
                CancellationToken cancellationToken) =>
            {
                var authenticationEnabled = configuration.IsAuthenticationEnabled();
                var content = authenticationEnabled && httpContext.User.IsInRole("Player")
                    ? await service.OpenForPlayerAsync(worldId, fileId, cancellationToken)
                    : await service.OpenAsync(worldId, fileId, cancellationToken);

                return content is null
                    ? Results.NotFound()
                    : Results.File(
                        content.Stream,
                        content.ContentType,
                        content.DownloadName,
                        enableRangeProcessing: true);
            });

        fileGroup.MapPatch("/trash",
            async (
                Guid worldId,
                Guid fileId,
                FileLibraryService service,
                CancellationToken cancellationToken) =>
                FileResult(await service.MoveToTrashAsync(
                    worldId,
                    fileId,
                    cancellationToken)))
            .RequireAuthorizationIfEnabled(
                configuration,
                AuthorizationPolicies.GameMasterOrAdministrator);

        fileGroup.MapPatch("/restore",
            async (
                Guid worldId,
                Guid fileId,
                RestoreFileRequest request,
                FileLibraryService service,
                CancellationToken cancellationToken) =>
                FileResult(await service.RestoreAsync(
                    worldId,
                    fileId,
                    request.DestinationFolderId,
                    cancellationToken)))
            .RequireAuthorizationIfEnabled(
                configuration,
                AuthorizationPolicies.GameMasterOrAdministrator);

        return app;
    }

    private static IResult FileResult(FileOperationResult result)
    {
        return result.Error switch
        {
            null => Results.Ok(result.File),
            "FileNotFound" => Results.NotFound(
                new { message = "Nie znaleziono pliku." }),
            "TrashNotFound" => Results.Problem(
                "Brakuje folderu Trash.",
                statusCode: StatusCodes.Status409Conflict),
            _ => Results.BadRequest(
                new
                {
                    message =
                        "Nie znaleziono bezpiecznego miejsca przywrócenia pliku."
                })
        };
    }
}
