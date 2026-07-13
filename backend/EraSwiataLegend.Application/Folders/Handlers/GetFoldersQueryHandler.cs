using EraSwiataLegend.Application.Folders.DTOs;
using EraSwiataLegend.Application.Interfaces;
using EraSwiataLegend.Domain.Entities;
using EraSwiataLegend.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace EraSwiataLegend.Application.Folders.Handlers;

public sealed class GetFoldersQueryHandler
{
    private readonly IApplicationDbContext _dbContext;

    public GetFoldersQueryHandler(
        IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<FolderDto>> HandleAsync(
        Guid worldId,
        bool playerView,
        CancellationToken cancellationToken = default)
    {
        var worldExists = await _dbContext.Worlds
            .AnyAsync(
                world => world.Id == worldId,
                cancellationToken);

        if (!worldExists)
        {
            return [];
        }

        var existingSystemTypes = playerView ? [] : await _dbContext.Folders
            .Where(folder =>
                folder.WorldId == worldId &&
                folder.Type != FolderType.Normal)
            .Select(folder => folder.Type)
            .ToListAsync(cancellationToken);

        var foldersToCreate = new List<Folder>();

        if (!existingSystemTypes.Contains(FolderType.Archive))
        {
            foldersToCreate.Add(
                new Folder
                {
                    WorldId = worldId,
                    Name = "Archive",
                    Type = FolderType.Archive
                });
        }

        if (!existingSystemTypes.Contains(FolderType.Trash))
        {
            foldersToCreate.Add(
                new Folder
                {
                    WorldId = worldId,
                    Name = "Trash",
                    Type = FolderType.Trash
                });
        }

        if (foldersToCreate.Count > 0)
        {
            _dbContext.Folders.AddRange(foldersToCreate);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        var folders = await _dbContext.Folders
            .AsNoTracking()
            .Where(folder => folder.WorldId == worldId)
            .OrderBy(folder => folder.Type)
            .ThenBy(folder => folder.Name)
            .Select(folder => new FolderDto(
                folder.Id,
                folder.WorldId,
                folder.ParentFolderId,
                folder.Name,
                folder.Type,
                folder.IsVisibleToPlayers,
                folder.CreatedAt,
                folder.UpdatedAt))
            .ToListAsync(cancellationToken);

        if (!playerView) return folders;
        var byId = folders.ToDictionary(folder => folder.Id);
        return folders.Where(folder =>
        {
            var current = folder;
            var visited = new HashSet<Guid>();
            while (true)
            {
                if (!current.IsVisibleToPlayers || !visited.Add(current.Id)) return false;
                if (!current.ParentFolderId.HasValue) return true;
                if (!byId.TryGetValue(current.ParentFolderId.Value, out var parent)) return false;
                current = parent;
            }
        }).ToList();
    }
}
