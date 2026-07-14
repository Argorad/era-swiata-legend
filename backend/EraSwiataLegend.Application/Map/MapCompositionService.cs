using System.Text.Json;
using EraSwiataLegend.Application.Interfaces;
using EraSwiataLegend.Domain.Entities;
using EraSwiataLegend.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace EraSwiataLegend.Application.Map;

public sealed class MapCompositionService
{
    private static readonly string[] MapImageTypes =
        ["image/png", "image/jpeg", "image/webp", "image/avif"];
    private readonly IApplicationDbContext _db;
    public MapCompositionService(IApplicationDbContext db) => _db = db;

    public Task<List<MapImageLayerDto>> GetLayersAsync(Guid worldId, Guid mapId, bool playerView, CancellationToken ct) =>
        _db.MapImageLayers.AsNoTracking()
            .Where(layer => layer.WorldId == worldId && layer.MapId == mapId &&
                (!playerView || (layer.IsVisible && layer.IsVisibleToPlayers && layer.Map.IsPublished && layer.Map.Status == WorldMapStatus.Active)))
            .OrderBy(layer => layer.SortOrder)
            .Select(layer => new MapImageLayerDto(
                layer.Id, layer.WorldId, layer.MapId, layer.FileAttachmentId,
                layer.FileAttachment.OriginalName, layer.FileAttachment.ContentType,
                layer.Name, layer.PositionX, layer.PositionY, layer.Scale,
                layer.Rotation, layer.SortOrder, layer.IsVisible,
                layer.IsVisibleToPlayers, layer.IsLocked, layer.Opacity, layer.CreatedAt, layer.UpdatedAt))
            .ToListAsync(ct);

    public async Task<MapImageLayerOperationResult> CreateLayerAsync(Guid worldId, Guid mapId, SaveMapImageLayerRequest request, CancellationToken ct)
    {
        if (!await MapExists(worldId, mapId, ct)) return new(null, "MapNotFound");
        if (!await ValidFile(worldId, request.FileAttachmentId, ct)) return new(null, "FileNotFound");
        if (!ValidLayer(request)) return new(null, "InvalidLayer");
        if (request.Id.HasValue && await _db.MapImageLayers.AnyAsync(item => item.Id == request.Id.Value, ct))
            return new(null, "LayerAlreadyExists");
        var layer = new MapImageLayer { Id = request.Id ?? Guid.NewGuid(), WorldId = worldId, MapId = mapId, FileAttachmentId = request.FileAttachmentId };
        Apply(layer, request);
        _db.MapImageLayers.Add(layer);
        await _db.SaveChangesAsync(ct);
        return await LayerResult(layer.Id, ct);
    }

    public async Task<MapImageLayerOperationResult> UpdateLayerAsync(Guid worldId, Guid mapId, Guid layerId, SaveMapImageLayerRequest request, CancellationToken ct)
    {
        var layer = await _db.MapImageLayers.FirstOrDefaultAsync(item => item.Id == layerId && item.WorldId == worldId && item.MapId == mapId, ct);
        if (layer is null) return new(null, "LayerNotFound");
        if (layer.IsLocked && (request.IsLocked || LayerChanged(layer, request))) return new(null, "LayerLocked");
        if (layer.FileAttachmentId != request.FileAttachmentId && !await ValidFile(worldId, request.FileAttachmentId, ct)) return new(null, "FileNotFound");
        if (!ValidLayer(request)) return new(null, "InvalidLayer");
        layer.FileAttachmentId = request.FileAttachmentId;
        Apply(layer, request);
        await _db.SaveChangesAsync(ct);
        return await LayerResult(layer.Id, ct);
    }

    public async Task<string?> DeleteLayerAsync(Guid worldId, Guid mapId, Guid layerId, CancellationToken ct)
    {
        var layer = await _db.MapImageLayers.FirstOrDefaultAsync(item => item.Id == layerId && item.WorldId == worldId && item.MapId == mapId, ct);
        if (layer is null) return "LayerNotFound";
        if (layer.IsLocked) return "LayerLocked";
        _db.MapImageLayers.Remove(layer);
        await _db.SaveChangesAsync(ct);
        return null;
    }

    public async Task<List<MapDrawingStrokeDto>> GetStrokesAsync(Guid worldId, Guid mapId, bool playerView, CancellationToken ct)
    {
        var strokes = await _db.MapDrawingStrokes.AsNoTracking()
            .Where(stroke => stroke.WorldId == worldId && stroke.MapId == mapId &&
                stroke.IsVisible &&
                (!playerView || (stroke.IsVisibleToPlayers && stroke.Map.IsDrawingLayerVisibleToPlayers &&
                    stroke.Map.IsPublished && stroke.Map.Status == WorldMapStatus.Active)))
            .OrderBy(stroke => stroke.SortOrder).ThenBy(stroke => stroke.CreatedAt).ToListAsync(ct);
        return strokes.Select(ToStrokeDto).ToList();
    }

    public async Task<MapDrawingStrokeDto?> AddStrokeAsync(Guid worldId, Guid mapId, SaveMapDrawingStrokeRequest request, CancellationToken ct)
    {
        var map = await _db.WorldMaps.AsNoTracking().FirstOrDefaultAsync(
            item => item.Id == mapId && item.WorldId == worldId && item.Status == WorldMapStatus.Active, ct);
        if (map is null || map.IsDrawingLayerLocked || !MapDrawingRequestValidator.IsValid(request)) return null;
        if (request.Id.HasValue && await _db.MapDrawingStrokes.AnyAsync(item => item.Id == request.Id.Value, ct)) return null;
        var stroke = new MapDrawingStroke
        {
            Id = request.Id ?? Guid.NewGuid(), WorldId = worldId, MapId = mapId, Color = request.Color,
            Width = request.Width, IsEraser = request.IsEraser,
            PointsJson = JsonSerializer.Serialize(request.Points),
            IsVisibleToPlayers = request.IsVisibleToPlayers,
            Tool = request.Tool, FillColor = request.FillColor, Opacity = request.Opacity,
            DashStyle = request.DashStyle, Text = request.Text, FontSize = request.FontSize,
            HasTextBorder = request.HasTextBorder, Rotation = request.Rotation, SortOrder = request.SortOrder,
            IsVisible = request.IsVisible, IsLocked = request.IsLocked
        };
        _db.MapDrawingStrokes.Add(stroke);
        await _db.SaveChangesAsync(ct);
        return ToStrokeDto(stroke);
    }

    public async Task<(MapDrawingStrokeDto? Stroke, string? Error)> UpdateStrokeAsync(
        Guid worldId, Guid mapId, Guid strokeId,
        SaveMapDrawingStrokeRequest request, CancellationToken ct)
    {
        var map = await _db.WorldMaps.FirstOrDefaultAsync(
            item => item.Id == mapId && item.WorldId == worldId, ct);
        if (map is null) return (null, "MapNotFound");
        var stroke = await _db.MapDrawingStrokes.FirstOrDefaultAsync(
            item => item.Id == strokeId && item.MapId == mapId && item.WorldId == worldId, ct);
        if (stroke is null) return (null, "DrawingNotFound");
        if (map.IsDrawingLayerLocked || (stroke.IsLocked && (request.IsLocked || StrokeChanged(stroke, request))))
            return (null, "DrawingLocked");
        if (!MapDrawingRequestValidator.IsValid(request)) return (null, "InvalidDrawing");
        ApplyStroke(stroke, request);
        stroke.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return (ToStrokeDto(stroke), null);
    }

    public async Task<string?> DeleteStrokeAsync(Guid worldId, Guid mapId, Guid strokeId, CancellationToken ct)
    {
        var stroke = await _db.MapDrawingStrokes.Include(item => item.Map)
            .FirstOrDefaultAsync(item => item.Id == strokeId && item.WorldId == worldId && item.MapId == mapId, ct);
        if (stroke is null) return "DrawingNotFound";
        if (stroke.IsLocked || stroke.Map.IsDrawingLayerLocked) return "DrawingLocked";
        _db.MapDrawingStrokes.Remove(stroke);
        await _db.SaveChangesAsync(ct);
        return null;
    }

    public async Task<string?> ClearStrokesAsync(Guid worldId, Guid mapId, CancellationToken ct)
    {
        var map = await _db.WorldMaps.AsNoTracking().FirstOrDefaultAsync(
            item => item.Id == mapId && item.WorldId == worldId, ct);
        if (map is null) return "MapNotFound";
        if (map.IsDrawingLayerLocked) return "DrawingLocked";
        var strokes = await _db.MapDrawingStrokes.Where(item => item.WorldId == worldId && item.MapId == mapId).ToListAsync(ct);
        if (strokes.Any(item => item.IsLocked)) return "DrawingLocked";
        _db.MapDrawingStrokes.RemoveRange(strokes);
        await _db.SaveChangesAsync(ct);
        return null;
    }

    public async Task<WorldMapDto?> ConfigureDrawingLayerAsync(
        Guid worldId, Guid mapId, ConfigureDrawingLayerRequest request,
        CancellationToken ct)
    {
        var map = await _db.WorldMaps.FirstOrDefaultAsync(
            item => item.Id == mapId && item.WorldId == worldId, ct);
        if (map is null) return null;
        map.ConfigureDrawingLayer(request.IsVisible, request.IsLocked,
            request.IsVisibleToPlayers);
        await _db.SaveChangesAsync(ct);
        return ToMapDto(map);
    }


    private Task<bool> MapExists(Guid worldId, Guid mapId, CancellationToken ct) =>
        _db.WorldMaps.AnyAsync(map => map.Id == mapId && map.WorldId == worldId && map.Status == WorldMapStatus.Active, ct);
    private Task<bool> ValidFile(Guid worldId, Guid fileId, CancellationToken ct) =>
        _db.FileAttachments.AnyAsync(file => file.Id == fileId && file.WorldId == worldId && file.Folder.Type != FolderType.Trash && MapImageTypes.Contains(file.ContentType), ct);
    private static bool ValidLayer(SaveMapImageLayerRequest request) =>
        !string.IsNullOrWhiteSpace(request.Name) && request.Name.Trim().Length <= 200 &&
        double.IsFinite(request.PositionX) && double.IsFinite(request.PositionY) &&
        request.Scale is >= .05 and <= 20 && request.Rotation is >= -3600 and <= 3600 &&
        request.SortOrder is >= 0 and <= 100000 && request.Opacity is >= 0 and <= 1;
    private static bool LayerChanged(MapImageLayer layer, SaveMapImageLayerRequest request) =>
        layer.Name != request.Name.Trim() || layer.PositionX != request.PositionX || layer.PositionY != request.PositionY ||
        layer.Scale != request.Scale || layer.Rotation != request.Rotation || layer.SortOrder != request.SortOrder ||
        layer.FileAttachmentId != request.FileAttachmentId || layer.IsVisible != request.IsVisible ||
        layer.IsVisibleToPlayers != request.IsVisibleToPlayers || layer.Opacity != request.Opacity;
    private static void Apply(MapImageLayer layer, SaveMapImageLayerRequest request) =>
        layer.Update(request.Name, request.PositionX, request.PositionY, request.Scale, request.Rotation,
            request.SortOrder, request.IsVisible, request.IsVisibleToPlayers, request.IsLocked, request.Opacity);
    private async Task<MapImageLayerOperationResult> LayerResult(Guid id, CancellationToken ct)
    {
        var dto = await _db.MapImageLayers.AsNoTracking().Where(layer => layer.Id == id)
            .Select(layer => new MapImageLayerDto(layer.Id, layer.WorldId, layer.MapId, layer.FileAttachmentId,
                layer.FileAttachment.OriginalName, layer.FileAttachment.ContentType, layer.Name, layer.PositionX,
                layer.PositionY, layer.Scale, layer.Rotation, layer.SortOrder, layer.IsVisible,
                layer.IsVisibleToPlayers, layer.IsLocked, layer.Opacity, layer.CreatedAt, layer.UpdatedAt)).SingleAsync(ct);
        return new(dto, null);
    }
    private static MapDrawingStrokeDto ToStrokeDto(MapDrawingStroke stroke) =>
        new(stroke.Id, stroke.WorldId, stroke.MapId, stroke.Color, stroke.Width, stroke.IsEraser,
            JsonSerializer.Deserialize<List<MapStrokePointDto>>(stroke.PointsJson) ?? [], stroke.IsVisibleToPlayers,
            stroke.CreatedAt, stroke.Tool, stroke.FillColor, stroke.Opacity, stroke.DashStyle, stroke.Text,
            stroke.FontSize, stroke.HasTextBorder, stroke.Rotation, stroke.SortOrder, stroke.IsVisible, stroke.IsLocked);

    private static void ApplyStroke(MapDrawingStroke stroke, SaveMapDrawingStrokeRequest request)
    {
        stroke.Color = request.Color; stroke.Width = request.Width;
        stroke.IsEraser = request.IsEraser; stroke.PointsJson = JsonSerializer.Serialize(request.Points);
        stroke.IsVisibleToPlayers = request.IsVisibleToPlayers; stroke.Tool = request.Tool;
        stroke.FillColor = request.FillColor; stroke.Opacity = request.Opacity;
        stroke.DashStyle = request.DashStyle; stroke.Text = request.Text;
        stroke.FontSize = request.FontSize; stroke.HasTextBorder = request.HasTextBorder; stroke.Rotation = request.Rotation;
        stroke.SortOrder = request.SortOrder; stroke.IsVisible = request.IsVisible;
        stroke.IsLocked = request.IsLocked;
    }

    private static bool StrokeChanged(MapDrawingStroke stroke, SaveMapDrawingStrokeRequest request) =>
        stroke.Color != request.Color || stroke.Width != request.Width || stroke.IsEraser != request.IsEraser ||
        stroke.PointsJson != JsonSerializer.Serialize(request.Points) ||
        stroke.IsVisibleToPlayers != request.IsVisibleToPlayers || stroke.Tool != request.Tool ||
        stroke.FillColor != request.FillColor || stroke.Opacity != request.Opacity ||
        stroke.DashStyle != request.DashStyle || stroke.Text != request.Text ||
        stroke.FontSize != request.FontSize || stroke.HasTextBorder != request.HasTextBorder || stroke.Rotation != request.Rotation ||
        stroke.SortOrder != request.SortOrder || stroke.IsVisible != request.IsVisible;

    private static WorldMapDto ToMapDto(WorldMap map) => new(
        map.Id, map.WorldId, map.Name, map.Description, map.Type, map.ImageFileId,
        map.IsPublished, map.IsDrawingLayerVisible, map.IsDrawingLayerLocked,
        map.IsDrawingLayerVisibleToPlayers, map.Status, map.CreatedAt, map.UpdatedAt);

}
