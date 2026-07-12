using EraSwiataLegend.Application.Folders.Commands;
using EraSwiataLegend.Application.Folders.DTOs;
using EraSwiataLegend.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EraSwiataLegend.Application.Folders.Handlers;

public sealed class RenameFolderCommandHandler
{
    private readonly IApplicationDbContext _dbContext;

    public RenameFolderCommandHandler(
        IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<RenameFolderResult> HandleAsync(
        RenameFolderCommand command,
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
            return new RenameFolderResult(
                null,
                "FolderNotFound");
        }

        try
        {
            folder.Rename(command.Name);
        }
        catch (InvalidOperationException)
        {
            return new RenameFolderResult(
                null,
                "SystemFolderCannotBeRenamed");
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        var dto = new FolderDto(
            folder.Id,
            folder.WorldId,
            folder.ParentFolderId,
            folder.Name,
            folder.Type,
            folder.CreatedAt,
            folder.UpdatedAt);

        return new RenameFolderResult(dto, null);
    }
}