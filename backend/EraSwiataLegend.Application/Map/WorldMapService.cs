using EraSwiataLegend.Application.Interfaces;
using EraSwiataLegend.Domain.Entities;
using EraSwiataLegend.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace EraSwiataLegend.Application.Map;

public sealed class WorldMapService
{
    private readonly IApplicationDbContext _dbContext;

    public WorldMapService(IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task<List<WorldMapDto>> GetAsync(
        Guid worldId,
        bool playerView,
        CancellationToken cancellationToken) =>
        _dbContext.WorldMaps
            .AsNoTracking()
            .Where(map =>
                map.WorldId == worldId &&
                (!playerView ||
                 (map.Status == WorldMapStatus.Active &&
                  map.IsPublished)))
            .OrderBy(map => map.Status)
            .ThenBy(map => map.Type)
            .ThenBy(map => map.Name)
            .Select(map => new WorldMapDto(
                map.Id,
                map.WorldId,
                map.Name,
                map.Description,
                map.Type,
                map.ImageFileId,
                map.IsPublished,
                map.IsGridVisible,
                map.GridSize,
                map.CanvasBackground, map.GridStyle, map.GridColor,
                map.GridOpacity, map.GridLineWidth, map.GridMajorEvery,
                map.IsGridMajorVisible, map.IsSnapToGridEnabled,
                map.IsDrawingLayerVisible, map.IsDrawingLayerLocked,
                map.IsDrawingLayerVisibleToPlayers,
                map.Status,
                map.CreatedAt,
                map.UpdatedAt))
            .ToListAsync(cancellationToken);

    public async Task<WorldMapOperationResult> CreateAsync(
        Guid worldId,
        SaveWorldMapRequest request,
        CancellationToken cancellationToken)
    {
        if (!await _dbContext.Worlds.AnyAsync(
                world => world.Id == worldId,
                cancellationToken))
        {
            return new(null, "WorldNotFound");
        }

        var validationError = await ValidateAsync(
            worldId,
            request,
            cancellationToken);

        if (validationError is not null)
        {
            return new(null, validationError);
        }

        await EnsureDefaultCategoriesAsync(
            worldId,
            cancellationToken);

        var map = new WorldMap { WorldId = worldId };
        map.Update(
            request.Name,
            request.Description ?? string.Empty,
            request.Type,
            request.ImageFileId,
            request.IsPublished);

        _dbContext.WorldMaps.Add(map);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new(ToDto(map), null);
    }

    public async Task<WorldMapOperationResult> UpdateAsync(
        Guid worldId,
        Guid mapId,
        SaveWorldMapRequest request,
        CancellationToken cancellationToken)
    {
        var map = await FindAsync(worldId, mapId, cancellationToken);

        if (map is null)
        {
            return new(null, "MapNotFound");
        }

        var validationError = await ValidateAsync(
            worldId,
            request,
            cancellationToken);

        if (validationError is not null)
        {
            return new(null, validationError);
        }

        map.Update(
            request.Name,
            request.Description ?? string.Empty,
            request.Type,
            request.ImageFileId,
            request.IsPublished);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new(ToDto(map), null);
    }

    public async Task<WorldMapOperationResult> SetArchivedAsync(
        Guid worldId,
        Guid mapId,
        bool archived,
        CancellationToken cancellationToken)
    {
        var map = await FindAsync(worldId, mapId, cancellationToken);

        if (map is null)
        {
            return new(null, "MapNotFound");
        }

        if (archived) map.Archive(); else map.Restore();
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new(ToDto(map), null);
    }

    private async Task<string?> ValidateAsync(
        Guid worldId,
        SaveWorldMapRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Name) ||
            request.Name.Trim().Length > 200 ||
            (request.Description?.Length ?? 0) > 2000 ||
            !Enum.IsDefined(request.Type))
        {
            return "InvalidMap";
        }

        var imageIsValid = await _dbContext.FileAttachments
            .AnyAsync(file =>
                file.Id == request.ImageFileId &&
                file.WorldId == worldId &&
                file.ContentType.StartsWith("image/") &&
                file.Folder.Type != FolderType.Trash,
                cancellationToken);

        return imageIsValid ? null : "ImageFileNotFound";
    }

    private async Task EnsureDefaultCategoriesAsync(
        Guid worldId,
        CancellationToken cancellationToken)
    {
        if (await _dbContext.MarkerCategories.AnyAsync(
                category => category.WorldId == worldId,
                cancellationToken))
        {
            return;
        }

        var categories = DefaultMarkerCategories.All
            .Select((item, index) => new MarkerCategory
            {
                WorldId = worldId,
                Name = item.Name,
                Icon = item.Icon,
                Color = item.Color,
                SortOrder = index * 10,
                IsActive = true
            });

        _dbContext.MarkerCategories.AddRange(categories);
    }

    private Task<WorldMap?> FindAsync(
        Guid worldId,
        Guid mapId,
        CancellationToken cancellationToken) =>
        _dbContext.WorldMaps.FirstOrDefaultAsync(
            map => map.Id == mapId && map.WorldId == worldId,
            cancellationToken);

    private static WorldMapDto ToDto(WorldMap map) =>
        new(
            map.Id,
            map.WorldId,
            map.Name,
            map.Description,
            map.Type,
            map.ImageFileId,
            map.IsPublished,
            map.IsGridVisible,
            map.GridSize,
            map.CanvasBackground, map.GridStyle, map.GridColor,
            map.GridOpacity, map.GridLineWidth, map.GridMajorEvery,
            map.IsGridMajorVisible, map.IsSnapToGridEnabled,
            map.IsDrawingLayerVisible, map.IsDrawingLayerLocked,
            map.IsDrawingLayerVisibleToPlayers,
            map.Status,
            map.CreatedAt,
            map.UpdatedAt);
}
