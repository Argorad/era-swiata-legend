using EraSwiataLegend.Application.Interfaces;
using EraSwiataLegend.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace EraSwiataLegend.Application.Search;

public sealed class KnowledgeSearchService
{
    private sealed record FolderPathItem(
        Guid Id,
        Guid WorldId,
        Guid? ParentFolderId,
        string Name,
        bool IsVisibleToPlayers);

    private readonly IApplicationDbContext _dbContext;

    public KnowledgeSearchService(IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task<List<SearchResultDto>> SearchAsync(
        string query,
        Guid? worldId,
        CancellationToken cancellationToken) =>
        SearchAsync(query, worldId, false, cancellationToken);

    public async Task<List<SearchResultDto>> SearchAsync(
        string query,
        Guid? worldId,
        bool playerView,
        CancellationToken cancellationToken)
    {
        var normalized = query.Trim().ToLowerInvariant();

        if (normalized.Length < 2)
        {
            return [];
        }

        var worlds = await _dbContext.Worlds
            .AsNoTracking()
            .Where(world =>
                (!worldId.HasValue || world.Id == worldId.Value) &&
                (!playerView || world.Status == WorldStatus.Active))
            .Select(world => new
            {
                world.Id,
                world.Name
            })
            .ToListAsync(cancellationToken);

        var worldNames = worlds.ToDictionary(
            world => world.Id,
            world => world.Name);
        var worldIds = worldNames.Keys.ToList();

        var folders = await _dbContext.Folders
            .AsNoTracking()
            .Where(folder => worldIds.Contains(folder.WorldId))
            .Select(folder => new FolderPathItem(
                folder.Id,
                folder.WorldId,
                folder.ParentFolderId,
                folder.Name,
                folder.IsVisibleToPlayers))
            .ToListAsync(cancellationToken);

        var folderById = folders.ToDictionary(folder => folder.Id);
        var results = new List<SearchResultDto>();

        results.AddRange(worlds
            .Where(world =>
                world.Name.Contains(
                    query,
                    StringComparison.OrdinalIgnoreCase))
            .Take(20)
            .Select(world => new SearchResultDto(
                "world",
                world.Id,
                world.Id,
                null,
                null,
                world.Name,
                world.Name,
                null)));

        results.AddRange(folders
            .Where(folder =>
                folder.Name.Contains(
                    query,
                    StringComparison.OrdinalIgnoreCase) &&
                (!playerView || IsVisibleToPlayer(folder, folderById)))
            .Take(30)
            .Select(folder => new SearchResultDto(
                "folder",
                folder.Id,
                folder.WorldId,
                folder.Id,
                null,
                folder.Name,
                BuildBreadcrumb(
                    folder.WorldId,
                    folder.Id,
                    worldNames,
                    folderById),
                null)));

        var pages = await _dbContext.Pages
            .AsNoTracking()
            .Where(page => worldIds.Contains(page.WorldId))
            .Select(page => new
            {
                page.Id,
                page.WorldId,
                page.FolderId,
                page.Title,
                page.Content
            })
            .ToListAsync(cancellationToken);

        results.AddRange(pages
            .Where(page =>
                page.Title.Contains(
                    query,
                    StringComparison.OrdinalIgnoreCase) ||
                page.Content.Contains(
                    query,
                    StringComparison.OrdinalIgnoreCase))
            .Where(page =>
                !playerView ||
                IsVisibleToPlayer(page.FolderId, page.WorldId, folderById))
            .Take(40)
            .Select(page => new SearchResultDto(
                "page",
                page.Id,
                page.WorldId,
                page.FolderId,
                page.Id,
                page.Title,
                BuildBreadcrumb(
                    page.WorldId,
                    page.FolderId,
                    worldNames,
                    folderById),
                BuildExcerpt(page.Content, query))));

        var files = await _dbContext.FileAttachments
            .AsNoTracking()
            .Where(file => worldIds.Contains(file.WorldId))
            .Select(file => new
            {
                file.Id,
                file.WorldId,
                file.FolderId,
                file.OriginalName,
                file.IsVisibleToPlayers
            })
            .ToListAsync(cancellationToken);

        results.AddRange(files
            .Where(file =>
                file.OriginalName.Contains(
                    query,
                    StringComparison.OrdinalIgnoreCase) &&
                (!playerView ||
                 (file.IsVisibleToPlayers &&
                  IsVisibleToPlayer(file.FolderId, file.WorldId, folderById))))
            .Take(30)
            .Select(file => new SearchResultDto(
                "file",
                file.Id,
                file.WorldId,
                file.FolderId,
                null,
                file.OriginalName,
                BuildBreadcrumb(
                    file.WorldId,
                    file.FolderId,
                    worldNames,
                    folderById),
                null)));

        return results
            .OrderBy(result => result.Type)
            .ThenBy(result => result.Name)
            .Take(80)
            .ToList();
    }

    private static bool IsVisibleToPlayer(
        FolderPathItem folder,
        IReadOnlyDictionary<Guid, FolderPathItem> folderById)
    {
        return IsVisibleToPlayer(folder.Id, folder.WorldId, folderById);
    }

    private static bool IsVisibleToPlayer(
        Guid? folderId,
        Guid worldId,
        IReadOnlyDictionary<Guid, FolderPathItem> folderById)
    {
        var currentId = folderId;
        var visited = new HashSet<Guid>();

        while (currentId.HasValue && visited.Add(currentId.Value))
        {
            if (!folderById.TryGetValue(currentId.Value, out var folder) ||
                folder.WorldId != worldId ||
                !folder.IsVisibleToPlayers)
            {
                return false;
            }

            currentId = folder.ParentFolderId;
        }

        return currentId is null;
    }

    private static string BuildBreadcrumb(
        Guid worldId,
        Guid? folderId,
        IReadOnlyDictionary<Guid, string> worldNames,
        IReadOnlyDictionary<Guid, FolderPathItem> folderById)
    {
        var names = new List<string>();
        var visited = new HashSet<Guid>();
        var currentId = folderId;

        while (currentId.HasValue && visited.Add(currentId.Value))
        {
            if (!folderById.TryGetValue(
                    currentId.Value,
                    out var folder))
            {
                break;
            }

            names.Insert(0, folder.Name);
            currentId = folder.ParentFolderId;
        }

        if (worldNames.TryGetValue(worldId, out var worldName))
        {
            names.Insert(0, worldName);
        }

        return string.Join(" › ", names);
    }

    private static string? BuildExcerpt(
        string content,
        string query)
    {
        var normalized = content.ReplaceLineEndings(" ").Trim();

        if (normalized.Length == 0)
        {
            return null;
        }

        var index = normalized.IndexOf(
            query,
            StringComparison.OrdinalIgnoreCase);
        var start = Math.Max(0, index < 0 ? 0 : index - 60);
        var length = Math.Min(180, normalized.Length - start);
        var excerpt = normalized.Substring(start, length);

        return $"{(start > 0 ? "…" : string.Empty)}{excerpt}{(start + length < normalized.Length ? "…" : string.Empty)}";
    }
}
