using System.Text.RegularExpressions;
using EraSwiataLegend.Application.Interfaces;
using EraSwiataLegend.Domain.Entities;
using EraSwiataLegend.Domain.Enums;
using EraSwiataLegend.Domain.Rules;
using Microsoft.EntityFrameworkCore;

namespace EraSwiataLegend.Application.Map;

public sealed partial class MapMarkerService
{
    private readonly IApplicationDbContext _dbContext;

    public MapMarkerService(IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task<List<MapMarkerDto>> GetAsync(
        Guid worldId,
        Guid mapId,
        bool playerView,
        MapMarkerStatus? status,
        CancellationToken cancellationToken) =>
        _dbContext.MapMarkers
            .AsNoTracking()
            .Where(marker =>
                marker.WorldId == worldId &&
                marker.MapId == mapId &&
                (!status.HasValue || marker.Status == status) &&
                (!playerView ||
                 (marker.Status == MapMarkerStatus.Active &&
                  marker.IsPublished &&
                  marker.Category!.IsActive &&
                  marker.Map!.IsPublished &&
                  marker.Map.Status == WorldMapStatus.Active)))
            .OrderBy(marker => marker.Name)
            .Select(marker => new MapMarkerDto(
                marker.Id,
                marker.WorldId,
                marker.MapId!.Value,
                marker.CategoryId!.Value,
                marker.Category!.Name,
                marker.Name,
                marker.Description,
                marker.Icon,
                marker.Color,
                marker.PositionX,
                marker.PositionY,
                marker.IsPublished,
                marker.IsPositionLocked,
                marker.Status,
                marker.PreviousStatus,
                marker.FolderId,
                marker.PageId,
                marker.TargetMapId,
                marker.CreatedAt,
                marker.UpdatedAt))
            .ToListAsync(cancellationToken);

    public async Task<MapMarkerOperationResult> CreateAsync(
        Guid worldId,
        Guid mapId,
        SaveMapMarkerRequest request,
        CancellationToken cancellationToken)
    {
        if (!await MapExistsAsync(worldId, mapId, cancellationToken))
        {
            return new(null, "MapNotFound");
        }

        var validationError = await ValidateLinksAsync(
            worldId,
            mapId,
            request,
            cancellationToken);

        if (validationError is not null)
        {
            return new(null, validationError);
        }

        if (request.Id.HasValue && await _dbContext.MapMarkers.AnyAsync(
                marker => marker.Id == request.Id.Value, cancellationToken))
        {
            return new(null, "MarkerAlreadyExists");
        }

        var marker = new MapMarker
        {
            Id = request.Id ?? Guid.NewGuid(),
            WorldId = worldId,
            MapId = mapId
        };

        Apply(marker, request);
        _dbContext.MapMarkers.Add(marker);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return await ResultAsync(marker.Id, cancellationToken);
    }

    public async Task<MapMarkerOperationResult> UpdateAsync(
        Guid worldId,
        Guid mapId,
        Guid markerId,
        SaveMapMarkerRequest request,
        CancellationToken cancellationToken)
    {
        var marker = await FindAsync(
            worldId,
            mapId,
            markerId,
            cancellationToken);

        if (marker is null) return new(null, "MarkerNotFound");

        if (marker.IsPositionLocked &&
            (marker.PositionX != request.PositionX || marker.PositionY != request.PositionY))
        {
            return new(null, "MarkerLocked");
        }

        var validationError = await ValidateLinksAsync(
            worldId,
            mapId,
            request,
            cancellationToken);

        if (validationError is not null)
        {
            return new(null, validationError);
        }

        Apply(marker, request);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return await ResultAsync(marker.Id, cancellationToken);
    }

    public Task<MapMarkerOperationResult> SetLockAsync(
        Guid worldId,
        Guid mapId,
        Guid markerId,
        bool isLocked,
        CancellationToken cancellationToken) =>
        MutateAsync(
            worldId,
            mapId,
            markerId,
            marker => marker.SetPositionLocked(isLocked),
            cancellationToken);

    public async Task<MapMarkerOperationResult> MoveAsync(
        Guid worldId,
        Guid mapId,
        Guid markerId,
        MoveMapMarkerRequest request,
        CancellationToken cancellationToken)
    {
        var marker = await FindAsync(
            worldId,
            mapId,
            markerId,
            cancellationToken);

        if (marker is null) return new(null, "MarkerNotFound");

        if (marker.IsPositionLocked) return new(null, "MarkerLocked");

        if (request.PositionX is < 0 or > 1 ||
            request.PositionY is < 0 or > 1)
        {
            return new(null, "InvalidMarker");
        }

        marker.Move(request.PositionX, request.PositionY);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return await ResultAsync(marker.Id, cancellationToken);
    }

    public Task<MapMarkerOperationResult> PublishAsync(
        Guid worldId,
        Guid mapId,
        Guid markerId,
        bool published,
        CancellationToken cancellationToken) =>
        MutateAsync(
            worldId,
            mapId,
            markerId,
            marker => marker.SetPublished(published),
            cancellationToken);

    public Task<MapMarkerOperationResult> ArchiveAsync(
        Guid worldId,
        Guid mapId,
        Guid markerId,
        CancellationToken cancellationToken) =>
        MutateAsync(
            worldId,
            mapId,
            markerId,
            marker => marker.Archive(),
            cancellationToken);

    public Task<MapMarkerOperationResult> TrashAsync(
        Guid worldId,
        Guid mapId,
        Guid markerId,
        CancellationToken cancellationToken) =>
        MutateAsync(
            worldId,
            mapId,
            markerId,
            marker => marker.MoveToTrash(),
            cancellationToken);

    public Task<MapMarkerOperationResult> RestoreAsync(
        Guid worldId,
        Guid mapId,
        Guid markerId,
        CancellationToken cancellationToken) =>
        MutateAsync(
            worldId,
            mapId,
            markerId,
            marker => marker.Restore(),
            cancellationToken);

    public async Task<string?> DeletePermanentlyAsync(
        Guid worldId,
        Guid mapId,
        Guid markerId,
        CancellationToken cancellationToken)
    {
        var marker = await FindAsync(
            worldId,
            mapId,
            markerId,
            cancellationToken);

        if (marker is null) return "MarkerNotFound";
        if (!KnowledgeLifecycleRules.CanPermanentlyDeleteMarker(
                marker.Status))
        {
            return "MarkerMustBeInTrash";
        }

        _dbContext.MapMarkers.Remove(marker);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return null;
    }

    private async Task<MapMarkerOperationResult> MutateAsync(
        Guid worldId,
        Guid mapId,
        Guid markerId,
        Action<MapMarker> action,
        CancellationToken cancellationToken)
    {
        var marker = await FindAsync(
            worldId,
            mapId,
            markerId,
            cancellationToken);

        if (marker is null) return new(null, "MarkerNotFound");

        action(marker);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return await ResultAsync(marker.Id, cancellationToken);
    }

    private async Task<string?> ValidateLinksAsync(
        Guid worldId,
        Guid mapId,
        SaveMapMarkerRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Name) ||
            request.Name.Trim().Length > 200 ||
            (request.Description?.Length ?? 0) > 2000 ||
            request.Icon.Trim().Length is < 1 or > 40 ||
            !HexColorRegex().IsMatch(request.Color.Trim()) ||
            request.PositionX is < 0 or > 1 ||
            request.PositionY is < 0 or > 1)
        {
            return "InvalidMarker";
        }

        if (!await _dbContext.MarkerCategories.AnyAsync(
                category =>
                    category.Id == request.CategoryId &&
                    category.WorldId == worldId,
                cancellationToken))
        {
            return "CategoryNotFound";
        }

        if (request.FolderId.HasValue &&
            !await _dbContext.Folders.AnyAsync(
                folder =>
                    folder.Id == request.FolderId.Value &&
                    folder.WorldId == worldId,
                cancellationToken))
        {
            return "FolderNotFound";
        }

        if (request.PageId.HasValue)
        {
            var page = await _dbContext.Pages
                .AsNoTracking()
                .Where(item =>
                    item.Id == request.PageId.Value &&
                    item.WorldId == worldId)
                .Select(item => new { item.FolderId })
                .SingleOrDefaultAsync(cancellationToken);

            if (page is null ||
                (request.FolderId.HasValue &&
                 page.FolderId != request.FolderId.Value))
            {
                return "PageNotFound";
            }
        }

        if (request.TargetMapId.HasValue &&
            (request.TargetMapId.Value == mapId ||
             !await MapExistsAsync(
                 worldId,
                 request.TargetMapId.Value,
                 cancellationToken)))
        {
            return "TargetMapNotFound";
        }

        return null;
    }

    private Task<bool> MapExistsAsync(
        Guid worldId,
        Guid mapId,
        CancellationToken cancellationToken) =>
        _dbContext.WorldMaps.AnyAsync(
            map =>
                map.Id == mapId &&
                map.WorldId == worldId &&
                map.Status == WorldMapStatus.Active,
            cancellationToken);

    private Task<MapMarker?> FindAsync(
        Guid worldId,
        Guid mapId,
        Guid markerId,
        CancellationToken cancellationToken) =>
        _dbContext.MapMarkers.FirstOrDefaultAsync(
            marker =>
                marker.Id == markerId &&
                marker.WorldId == worldId &&
                marker.MapId == mapId,
            cancellationToken);

    private async Task<MapMarkerOperationResult> ResultAsync(
        Guid markerId,
        CancellationToken cancellationToken)
    {
        var dto = await _dbContext.MapMarkers
            .AsNoTracking()
            .Where(marker => marker.Id == markerId)
            .Select(marker => new MapMarkerDto(
                marker.Id,
                marker.WorldId,
                marker.MapId!.Value,
                marker.CategoryId!.Value,
                marker.Category!.Name,
                marker.Name,
                marker.Description,
                marker.Icon,
                marker.Color,
                marker.PositionX,
                marker.PositionY,
                marker.IsPublished,
                marker.IsPositionLocked,
                marker.Status,
                marker.PreviousStatus,
                marker.FolderId,
                marker.PageId,
                marker.TargetMapId,
                marker.CreatedAt,
                marker.UpdatedAt))
            .SingleAsync(cancellationToken);

        return new(dto, null);
    }

    private static void Apply(
        MapMarker marker,
        SaveMapMarkerRequest request)
    {
        marker.Update(
            request.Name,
            request.Description ?? string.Empty,
            MapMarkerType.Place,
            request.PositionX,
            request.PositionY,
            request.FolderId,
            request.PageId,
            request.TargetMapId,
            request.CategoryId,
            request.Icon,
            request.Color,
            request.IsPublished);

        marker.SetPositionLocked(request.IsPositionLocked);
    }

    [GeneratedRegex("^#[0-9a-fA-F]{6}$")]
    private static partial Regex HexColorRegex();
}
