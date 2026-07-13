using EraSwiataLegend.Application.Interfaces;
using EraSwiataLegend.Application.Pages.DTOs;
using EraSwiataLegend.Domain.Entities;
using EraSwiataLegend.Domain.Enums;
using EraSwiataLegend.Domain.Rules;
using Microsoft.EntityFrameworkCore;

namespace EraSwiataLegend.Application.Pages.Handlers;

public sealed record PageOperationResult(
    PageDto? Page,
    string? Error);

public sealed class PageManagementService
{
    private readonly IApplicationDbContext _dbContext;

    public PageManagementService(IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<PageOperationResult> UpdateAsync(
        Guid worldId,
        Guid pageId,
        string title,
        string content,
        CancellationToken cancellationToken)
    {
        var page = await FindPageAsync(
            worldId,
            pageId,
            cancellationToken);

        if (page is null)
        {
            return new(null, "PageNotFound");
        }

        page.Edit(title, content);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new(ToDto(page), null);
    }

    public async Task<PageOperationResult> MoveAsync(
        Guid worldId,
        Guid pageId,
        Guid destinationFolderId,
        CancellationToken cancellationToken)
    {
        var page = await FindPageAsync(
            worldId,
            pageId,
            cancellationToken);

        if (page is null)
        {
            return new(null, "PageNotFound");
        }

        var destination = await FindFolderAsync(
            worldId,
            destinationFolderId,
            cancellationToken);

        if (destination is null)
        {
            return new(null, "DestinationFolderNotFound");
        }

        var currentFolderType = await _dbContext.Folders
            .Where(folder => folder.Id == page.FolderId)
            .Select(folder => folder.Type)
            .SingleAsync(cancellationToken);

        var rememberCurrent =
            destination.Type is FolderType.Archive or FolderType.Trash &&
            currentFolderType == FolderType.Normal;

        page.MoveTo(destination.Id, rememberCurrent);

        if (destination.Type == FolderType.Normal)
        {
            page.PreviousFolderId = null;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        return new(ToDto(page), null);
    }

    public async Task<PageOperationResult> MoveToSystemFolderAsync(
        Guid worldId,
        Guid pageId,
        FolderType folderType,
        CancellationToken cancellationToken)
    {
        var systemFolderId = await _dbContext.Folders
            .Where(folder =>
                folder.WorldId == worldId &&
                folder.Type == folderType)
            .Select(folder => (Guid?)folder.Id)
            .SingleOrDefaultAsync(cancellationToken);

        if (systemFolderId is null)
        {
            return new(null, "SystemFolderNotFound");
        }

        return await MoveAsync(
            worldId,
            pageId,
            systemFolderId.Value,
            cancellationToken);
    }

    public async Task<PageOperationResult> RestoreAsync(
        Guid worldId,
        Guid pageId,
        Guid? destinationFolderId,
        CancellationToken cancellationToken)
    {
        var page = await FindPageAsync(
            worldId,
            pageId,
            cancellationToken);

        if (page is null)
        {
            return new(null, "PageNotFound");
        }

        var currentFolder = await FindFolderAsync(
            worldId,
            page.FolderId,
            cancellationToken);

        if (currentFolder?.Type == FolderType.Normal)
        {
            return new(null, "PageIsNotArchived");
        }

        var restoreFolderId =
            destinationFolderId ?? page.PreviousFolderId;

        if (restoreFolderId is null)
        {
            return new(null, "RestoreDestinationNotFound");
        }

        var restoreFolder = await FindFolderAsync(
            worldId,
            restoreFolderId.Value,
            cancellationToken);

        if (restoreFolder is null ||
            restoreFolder.Type != FolderType.Normal)
        {
            return new(null, "RestoreDestinationNotFound");
        }

        page.RestoreTo(restoreFolder.Id);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new(ToDto(page), null);
    }

    public async Task<string?> DeletePermanentlyAsync(
        Guid worldId,
        Guid pageId,
        CancellationToken cancellationToken)
    {
        var page = await FindPageAsync(
            worldId,
            pageId,
            cancellationToken);

        if (page is null)
        {
            return "PageNotFound";
        }

        var isInTrash = await _dbContext.Folders.AnyAsync(
            folder =>
                folder.Id == page.FolderId &&
                folder.WorldId == worldId &&
                folder.Type == FolderType.Trash,
            cancellationToken);

        if (!KnowledgeLifecycleRules.CanPermanentlyDeletePage(
                isInTrash ? FolderType.Trash : FolderType.Normal))
        {
            return "PageMustBeInTrash";
        }

        _dbContext.Pages.Remove(page);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return null;
    }

    private Task<Page?> FindPageAsync(
        Guid worldId,
        Guid pageId,
        CancellationToken cancellationToken)
    {
        return _dbContext.Pages.FirstOrDefaultAsync(
            page =>
                page.Id == pageId &&
                page.WorldId == worldId,
            cancellationToken);
    }

    private Task<Folder?> FindFolderAsync(
        Guid worldId,
        Guid folderId,
        CancellationToken cancellationToken)
    {
        return _dbContext.Folders.FirstOrDefaultAsync(
            folder =>
                folder.Id == folderId &&
                folder.WorldId == worldId,
            cancellationToken);
    }

    private static PageDto ToDto(Page page) =>
        new(
            page.Id,
            page.WorldId,
            page.FolderId,
            page.PreviousFolderId,
            page.Title,
            page.Content,
            page.CreatedAt,
            page.UpdatedAt);
}
