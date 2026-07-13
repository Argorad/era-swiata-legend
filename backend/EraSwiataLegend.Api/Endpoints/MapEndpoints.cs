using EraSwiataLegend.Api.Authorization;
using EraSwiataLegend.Application.Map;
using EraSwiataLegend.Application.Files;
using EraSwiataLegend.Domain.Enums;

namespace EraSwiataLegend.Api.Endpoints;

public static class MapEndpoints
{
    public static IEndpointRouteBuilder MapMapEndpoints(
        this IEndpointRouteBuilder app,
        IConfiguration configuration)
    {
        var maps = app.MapGroup("/worlds/{worldId:guid}/maps")
            .WithTags("Maps");

        maps.MapGet("/",
            async (
                Guid worldId,
                bool playerView,
                WorldMapService service,
                CancellationToken cancellationToken) =>
                Results.Ok(await service.GetAsync(
                    worldId,
                    playerView,
                    cancellationToken)));

        Protect(maps.MapPost("/",
            async (
                Guid worldId,
                SaveWorldMapRequest request,
                WorldMapService service,
                CancellationToken cancellationToken) =>
                MapResult(await service.CreateAsync(
                    worldId,
                    request,
                    cancellationToken), true)), configuration);

        Protect(maps.MapPut("/{mapId:guid}",
            async (
                Guid worldId,
                Guid mapId,
                SaveWorldMapRequest request,
                WorldMapService service,
                CancellationToken cancellationToken) =>
                MapResult(await service.UpdateAsync(
                    worldId,
                    mapId,
                    request,
                    cancellationToken), false)), configuration);

        Protect(maps.MapPatch("/{mapId:guid}/archive",
            async (
                Guid worldId,
                Guid mapId,
                WorldMapService service,
                CancellationToken cancellationToken) =>
                MapResult(await service.SetArchivedAsync(
                    worldId,
                    mapId,
                    true,
                    cancellationToken), false)), configuration);

        Protect(maps.MapPatch("/{mapId:guid}/restore",
            async (
                Guid worldId,
                Guid mapId,
                WorldMapService service,
                CancellationToken cancellationToken) =>
                MapResult(await service.SetArchivedAsync(
                    worldId,
                    mapId,
                    false,
                    cancellationToken), false)), configuration);

        var categories = app.MapGroup(
                "/worlds/{worldId:guid}/map-categories")
            .WithTags("Map categories");

        categories.MapGet("/",
            async (
                Guid worldId,
                bool playerView,
                MarkerCategoryService service,
                CancellationToken cancellationToken) =>
                Results.Ok(await service.GetAsync(
                    worldId,
                    playerView,
                    cancellationToken)));

        Protect(categories.MapPost("/",
            async (
                Guid worldId,
                SaveMarkerCategoryRequest request,
                MarkerCategoryService service,
                CancellationToken cancellationToken) =>
                CategoryResult(await service.CreateAsync(
                    worldId,
                    request,
                    cancellationToken), true)), configuration);

        Protect(categories.MapPut("/{categoryId:guid}",
            async (
                Guid worldId,
                Guid categoryId,
                SaveMarkerCategoryRequest request,
                MarkerCategoryService service,
                CancellationToken cancellationToken) =>
                CategoryResult(await service.UpdateAsync(
                    worldId,
                    categoryId,
                    request,
                    cancellationToken), false)), configuration);

        var markers = app.MapGroup(
                "/worlds/{worldId:guid}/maps/{mapId:guid}/markers")
            .WithTags("Map markers");

        markers.MapGet("/",
            async (
                Guid worldId,
                Guid mapId,
                bool playerView,
                MapMarkerStatus? status,
                MapMarkerService service,
                CancellationToken cancellationToken) =>
                Results.Ok(await service.GetAsync(
                    worldId,
                    mapId,
                    playerView,
                    status ?? MapMarkerStatus.Active,
                    cancellationToken)));

        Protect(markers.MapPost("/",
            async (
                Guid worldId,
                Guid mapId,
                SaveMapMarkerRequest request,
                MapMarkerService service,
                CancellationToken cancellationToken) =>
                MarkerResult(await service.CreateAsync(
                    worldId,
                    mapId,
                    request,
                    cancellationToken), true)), configuration);

        Protect(markers.MapPut("/{markerId:guid}",
            async (
                Guid worldId,
                Guid mapId,
                Guid markerId,
                SaveMapMarkerRequest request,
                MapMarkerService service,
                CancellationToken cancellationToken) =>
                MarkerResult(await service.UpdateAsync(
                    worldId,
                    mapId,
                    markerId,
                    request,
                    cancellationToken), false)), configuration);

        Protect(markers.MapPatch("/{markerId:guid}/position",
            async (
                Guid worldId,
                Guid mapId,
                Guid markerId,
                MoveMapMarkerRequest request,
                MapMarkerService service,
                CancellationToken cancellationToken) =>
                MarkerResult(await service.MoveAsync(
                    worldId,
                    mapId,
                    markerId,
                    request,
                    cancellationToken), false)), configuration);

        Protect(markers.MapPatch("/{markerId:guid}/lock",
            async (Guid worldId, Guid mapId, Guid markerId,
                SetMarkerLockRequest request, MapMarkerService service,
                CancellationToken cancellationToken) =>
                MarkerResult(await service.SetLockAsync(
                    worldId, mapId, markerId, request.IsLocked, cancellationToken), false)), configuration);

        MapMarkerAction(markers, "publish", true, configuration);
        MapMarkerAction(markers, "hide", false, configuration);

        Protect(markers.MapPatch("/{markerId:guid}/archive",
            async (
                Guid worldId,
                Guid mapId,
                Guid markerId,
                MapMarkerService service,
                CancellationToken cancellationToken) =>
                MarkerResult(await service.ArchiveAsync(
                    worldId, mapId, markerId, cancellationToken), false)),
            configuration);

        Protect(markers.MapPatch("/{markerId:guid}/trash",
            async (
                Guid worldId,
                Guid mapId,
                Guid markerId,
                MapMarkerService service,
                CancellationToken cancellationToken) =>
                MarkerResult(await service.TrashAsync(
                    worldId, mapId, markerId, cancellationToken), false)),
            configuration);

        Protect(markers.MapPatch("/{markerId:guid}/restore",
            async (
                Guid worldId,
                Guid mapId,
                Guid markerId,
                MapMarkerService service,
                CancellationToken cancellationToken) =>
                MarkerResult(await service.RestoreAsync(
                    worldId, mapId, markerId, cancellationToken), false)),
            configuration);

        Protect(markers.MapDelete("/{markerId:guid}",
            async (
                Guid worldId,
                Guid mapId,
                Guid markerId,
                MapMarkerService service,
                CancellationToken cancellationToken) =>
            {
                var error = await service.DeletePermanentlyAsync(
                    worldId, mapId, markerId, cancellationToken);
                return error switch
                {
                    null => Results.NoContent(),
                    "MarkerNotFound" => Results.NotFound(),
                    _ => Results.BadRequest(new
                    {
                        message =
                            "Trwale usunąć można wyłącznie marker w Trash."
                    })
                };
            }), configuration);

        var composition = app.MapGroup("/worlds/{worldId:guid}/maps/{mapId:guid}")
            .WithTags("Map composition");

        composition.MapGet("/images/{fileId:guid}",
            async (Guid worldId, Guid mapId, Guid fileId, bool playerView,
                HttpContext httpContext, FileLibraryService service,
                CancellationToken cancellationToken) =>
            {
                var authenticationEnabled = configuration.GetValue<bool>("Authentication:Enabled");
                if (authenticationEnabled && httpContext.User.Identity?.IsAuthenticated != true)
                    return Results.Unauthorized();
                var effectivePlayerView = playerView ||
                    (authenticationEnabled && httpContext.User.IsInRole("Player"));
                var content = await service.OpenMapImageAsync(
                    worldId, mapId, fileId, effectivePlayerView, cancellationToken);
                return content is null ? Results.NotFound() : Results.File(
                    content.Stream, content.ContentType, enableRangeProcessing: true);
            });

        composition.MapGet("/layers",
            async (Guid worldId, Guid mapId, bool playerView,
                MapCompositionService service, CancellationToken cancellationToken) =>
                Results.Ok(await service.GetLayersAsync(worldId, mapId, playerView, cancellationToken)));
        Protect(composition.MapPost("/layers",
            async (Guid worldId, Guid mapId, SaveMapImageLayerRequest request,
                MapCompositionService service, CancellationToken cancellationToken) =>
                LayerResult(await service.CreateLayerAsync(worldId, mapId, request, cancellationToken), true)), configuration);
        Protect(composition.MapPut("/layers/{layerId:guid}",
            async (Guid worldId, Guid mapId, Guid layerId, SaveMapImageLayerRequest request,
                MapCompositionService service, CancellationToken cancellationToken) =>
                LayerResult(await service.UpdateLayerAsync(worldId, mapId, layerId, request, cancellationToken), false)), configuration);
        Protect(composition.MapDelete("/layers/{layerId:guid}",
            async (Guid worldId, Guid mapId, Guid layerId,
                MapCompositionService service, CancellationToken cancellationToken) =>
            {
                var error = await service.DeleteLayerAsync(worldId, mapId, layerId, cancellationToken);
                return error switch
                {
                    null => Results.NoContent(),
                    "LayerNotFound" => Results.NotFound(),
                    _ => Results.Conflict(new { message = "Element jest zablokowany" })
                };
            }), configuration);

        composition.MapGet("/drawings",
            async (Guid worldId, Guid mapId, bool playerView,
                MapCompositionService service, CancellationToken cancellationToken) =>
                Results.Ok(await service.GetStrokesAsync(worldId, mapId, playerView, cancellationToken)));
        Protect(composition.MapPost("/drawings",
            async (Guid worldId, Guid mapId, SaveMapDrawingStrokeRequest request,
                MapCompositionService service, CancellationToken cancellationToken) =>
            {
                var stroke = await service.AddStrokeAsync(worldId, mapId, request, cancellationToken);
                return stroke is null ? Results.BadRequest() : Results.Created($"/worlds/{worldId}/maps/{mapId}/drawings/{stroke.Id}", stroke);
            }), configuration);
        Protect(composition.MapPut("/drawings/{strokeId:guid}",
            async (Guid worldId, Guid mapId, Guid strokeId,
                SaveMapDrawingStrokeRequest request,
                MapCompositionService service, CancellationToken cancellationToken) =>
            {
                var result = await service.UpdateStrokeAsync(
                    worldId, mapId, strokeId, request, cancellationToken);
                return result.Error switch
                {
                    null => Results.Ok(result.Stroke),
                    "DrawingNotFound" or "MapNotFound" => Results.NotFound(),
                    "DrawingLocked" => Results.Conflict(new { message = "Element jest zablokowany" }),
                    _ => Results.BadRequest(new { message = "Nieprawidłowa adnotacja." })
                };
            }), configuration);
        Protect(composition.MapDelete("/drawings/{strokeId:guid}",
            async (Guid worldId, Guid mapId, Guid strokeId,
                MapCompositionService service, CancellationToken cancellationToken) =>
            {
                var error = await service.DeleteStrokeAsync(worldId, mapId, strokeId, cancellationToken);
                return error switch
                {
                    null => Results.NoContent(),
                    "DrawingLocked" => Results.Conflict(new { message = "Element jest zablokowany" }),
                    _ => Results.NotFound()
                };
            }), configuration);
        Protect(composition.MapDelete("/drawings",
            async (Guid worldId, Guid mapId, MapCompositionService service, CancellationToken cancellationToken) =>
            {
                var error = await service.ClearStrokesAsync(worldId, mapId, cancellationToken);
                return error switch
                {
                    null => Results.NoContent(),
                    "DrawingLocked" => Results.Conflict(new { message = "Warstwa rysunków zawiera blokady." }),
                    _ => Results.NotFound()
                };
            }), configuration);
        Protect(composition.MapPatch("/drawing-layer",
            async (Guid worldId, Guid mapId, ConfigureDrawingLayerRequest request,
                MapCompositionService service, CancellationToken cancellationToken) =>
            {
                var map = await service.ConfigureDrawingLayerAsync(
                    worldId, mapId, request, cancellationToken);
                return map is null ? Results.NotFound() : Results.Ok(map);
            }), configuration);
        Protect(composition.MapPatch("/grid",
            async (Guid worldId, Guid mapId, ConfigureMapGridRequest request,
                MapCompositionService service, CancellationToken cancellationToken) =>
            {
                var map = await service.ConfigureGridAsync(worldId, mapId, request, cancellationToken);
                return map is null ? Results.BadRequest() : Results.Ok(map);
            }), configuration);

        return app;
    }

    private static void MapMarkerAction(
        RouteGroupBuilder group,
        string route,
        bool published,
        IConfiguration configuration)
    {
        Protect(group.MapPatch($"/{{markerId:guid}}/{route}",
            async (
                Guid worldId,
                Guid mapId,
                Guid markerId,
                MapMarkerService service,
                CancellationToken cancellationToken) =>
                MarkerResult(await service.PublishAsync(
                    worldId,
                    mapId,
                    markerId,
                    published,
                    cancellationToken), false)), configuration);
    }

    private static void Protect(
        RouteHandlerBuilder endpoint,
        IConfiguration configuration)
    {
        if (configuration.GetValue<bool>("Authentication:Enabled"))
        {
            endpoint.RequireAuthorization(
                AuthorizationPolicies.GameMasterOrAdministrator);
        }
    }

    private static IResult MapResult(
        WorldMapOperationResult result,
        bool created) => result.Error switch
    {
        null when created => Results.Created(
            $"/worlds/{result.Map!.WorldId}/maps/{result.Map.Id}",
            result.Map),
        null => Results.Ok(result.Map),
        "WorldNotFound" or "MapNotFound" => Results.NotFound(),
        "ImageFileNotFound" => Results.BadRequest(new
        {
            message = "Obraz mapy nie istnieje w tym świecie lub nie jest obrazem."
        }),
        _ => Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["map"] = ["Sprawdź nazwę, opis, typ i obraz mapy."]
        })
    };

    private static IResult CategoryResult(
        MarkerCategoryOperationResult result,
        bool created) => result.Error switch
    {
        null when created => Results.Created(
            $"/worlds/{result.Category!.WorldId}/map-categories/{result.Category.Id}",
            result.Category),
        null => Results.Ok(result.Category),
        "WorldNotFound" or "CategoryNotFound" => Results.NotFound(),
        "DuplicateCategoryName" => Results.Conflict(new
        {
            message = "Kategoria o tej nazwie już istnieje."
        }),
        _ => Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["category"] = ["Sprawdź nazwę, ikonę, kolor i kolejność."]
        })
    };

    private static IResult MarkerResult(
        MapMarkerOperationResult result,
        bool created)
    {
        if (result.Error is null)
        {
            return created
                ? Results.Created(
                    $"/worlds/{result.Marker!.WorldId}/maps/{result.Marker.MapId}/markers/{result.Marker.Id}",
                    result.Marker)
                : Results.Ok(result.Marker);
        }

        return result.Error switch
        {
            "MapNotFound" or "MarkerNotFound" => Results.NotFound(),
            "CategoryNotFound" => Results.BadRequest(new
            {
                message = "Kategoria nie istnieje w tym świecie."
            }),
            "FolderNotFound" => Results.BadRequest(new
            {
                message = "Folder nie istnieje w tym świecie."
            }),
            "PageNotFound" => Results.BadRequest(new
            {
                message = "Strona nie istnieje w tym świecie lub folderze."
            }),
            "TargetMapNotFound" => Results.BadRequest(new
            {
                message = "Mapa docelowa nie istnieje w tym świecie."
            }),
            "MarkerLocked" => Results.Conflict(new
            {
                message = "Element jest zablokowany"
            }),
            _ => Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["marker"] =
                [
                    "Sprawdź nazwę, ikonę, kolor i względną pozycję 0–1."
                ]
            })
        };
    }

    private static IResult LayerResult(MapImageLayerOperationResult result, bool created) => result.Error switch
    {
        null when created => Results.Created($"/worlds/{result.Layer!.WorldId}/maps/{result.Layer.MapId}/layers/{result.Layer.Id}", result.Layer),
        null => Results.Ok(result.Layer),
        "MapNotFound" or "LayerNotFound" => Results.NotFound(),
        "LayerLocked" => Results.Conflict(new { message = "Element jest zablokowany" }),
        "FileNotFound" => Results.BadRequest(new { message = "Obraz nie istnieje w bibliotece tego świata." }),
        _ => Results.ValidationProblem(new Dictionary<string, string[]> { ["layer"] = ["Sprawdź nazwę, pozycję, skalę, obrót i kolejność warstwy."] })
    };
}
