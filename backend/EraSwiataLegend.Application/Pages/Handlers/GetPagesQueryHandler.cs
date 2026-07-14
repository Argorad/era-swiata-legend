using EraSwiataLegend.Application.Interfaces;
using EraSwiataLegend.Application.Pages.DTOs;
using Microsoft.EntityFrameworkCore;

namespace EraSwiataLegend.Application.Pages.Handlers;

public sealed class GetPagesQueryHandler
{
    private readonly IApplicationDbContext _dbContext;

    public GetPagesQueryHandler(
        IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task<List<PageDto>> HandleAsync(
        Guid worldId,
        Guid folderId,
        CancellationToken cancellationToken = default) =>
        HandleAsync(
            worldId,
            folderId,
            false,
            cancellationToken);

    public async Task<List<PageDto>> HandleAsync(
        Guid worldId,
        Guid folderId,
        bool playerView,
        CancellationToken cancellationToken = default)
    {
        var pages = await _dbContext.Pages
            .AsNoTracking()
            .Where(page =>
                page.WorldId == worldId &&
                page.FolderId == folderId)
            .OrderBy(page => page.Title)
            .Select(page => new PageDto(
                page.Id,
                page.WorldId,
                page.FolderId,
                page.PreviousFolderId,
                page.Title,
                page.Content,
                page.CreatedAt,
                page.UpdatedAt))
            .ToListAsync(cancellationToken);

        if (!playerView)
        {
            return pages;
        }

        var folders = await _dbContext.Folders
            .AsNoTracking()
            .Where(folder =>
                folder.WorldId == worldId)
            .Select(folder => new
            {
                folder.Id,
                folder.ParentFolderId,
                folder.IsVisibleToPlayers
            })
            .ToDictionaryAsync(
                folder => folder.Id,
                cancellationToken);

        return pages
            .Where(page =>
            {
                Guid? currentFolderId = page.FolderId;
                var visited = new HashSet<Guid>();

                while (
                    currentFolderId.HasValue &&
                    visited.Add(currentFolderId.Value))
                {
                    if (!folders.TryGetValue(
                            currentFolderId.Value,
                            out var folder) ||
                        !folder.IsVisibleToPlayers)
                    {
                        return false;
                    }

                    currentFolderId =
                        folder.ParentFolderId;
                }

                return currentFolderId is null;
            })
            .ToList();
    }
}