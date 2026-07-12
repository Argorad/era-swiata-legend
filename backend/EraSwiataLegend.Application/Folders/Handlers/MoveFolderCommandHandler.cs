using EraSwiataLegend.Application.Folders.Commands;
using EraSwiataLegend.Application.Folders.DTOs;
using EraSwiataLegend.Application.Interfaces;
using EraSwiataLegend.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace EraSwiataLegend.Application.Folders.Handlers;

public sealed class MoveFolderCommandHandler
{
    private readonly IApplicationDbContext _dbContext;

    public MoveFolderCommandHandler(
        IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<MoveFolderResult> HandleAsync(
        MoveFolderCommand command,
        CancellationToken cancellationToken = default)
    {
        var folder = await _dbContext.Folders
            .FirstOrDefaultAsync(
                item =>
                    item.Id == command.FolderId &&
                    item.WorldId == command.WorldId,
                cancellationToken);

        if (folder is null)
        {
            return new MoveFolderResult(
                null,
                "FolderNotFound");
        }

        if (folder.Type is FolderType.Archive or FolderType.Trash)
        {
            return new MoveFolderResult(
                null,
                "SystemFolderCannotBeMoved");
        }

        if (command.DestinationFolderId == folder.Id)
        {
            return new MoveFolderResult(
                null,
                "CannotMoveToSelf");
        }

        var folders = await _dbContext.Folders
            .Where(item => item.WorldId == command.WorldId)
            .Select(item => new
            {
                item.Id,
                item.ParentFolderId
            })
            .ToListAsync(cancellationToken);

        var parentByFolderId = folders.ToDictionary(
            item => item.Id,
            item => item.ParentFolderId);

        if (command.DestinationFolderId is not null &&
            !parentByFolderId.ContainsKey(
                command.DestinationFolderId.Value))
        {
            return new MoveFolderResult(
                null,
                "DestinationFolderNotFound");
        }

        var currentId = command.DestinationFolderId;

        while (currentId is not null)
        {
            if (currentId.Value == folder.Id)
            {
                return new MoveFolderResult(
                    null,
                    "CannotMoveToDescendant");
            }

            if (!parentByFolderId.TryGetValue(
                    currentId.Value,
                    out var parentId))
            {
                break;
            }

            currentId = parentId;
        }

        folder.MoveTo(command.DestinationFolderId);

        await _dbContext.SaveChangesAsync(cancellationToken);

        var dto = new FolderDto(
            folder.Id,
            folder.WorldId,
            folder.ParentFolderId,
            folder.Name,
            folder.Type,
            folder.CreatedAt,
            folder.UpdatedAt);

        return new MoveFolderResult(dto, null);
    }
}