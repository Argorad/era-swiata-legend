using EraSwiataLegend.Application.Folders.Commands;
using EraSwiataLegend.Application.Folders.DTOs;
using EraSwiataLegend.Application.Interfaces;
using EraSwiataLegend.Domain.Entities;
using EraSwiataLegend.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace EraSwiataLegend.Application.Folders.Handlers;

public sealed class CreateFolderCommandHandler
{
    private readonly IApplicationDbContext _dbContext;

    public CreateFolderCommandHandler(IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<CreateFolderResult> HandleAsync(
        CreateFolderCommand command,
        CancellationToken cancellationToken = default)
    {
        var worldExists = await _dbContext.Worlds
            .AnyAsync(
                world => world.Id == command.WorldId,
                cancellationToken);

        if (!worldExists)
        {
            return new CreateFolderResult(
                null,
                "WorldNotFound");
        }

        if (command.ParentFolderId is not null)
        {
            var parentExists = await _dbContext.Folders
                .AnyAsync(
                    folder =>
                        folder.Id == command.ParentFolderId &&
                        folder.WorldId == command.WorldId,
                    cancellationToken);

            if (!parentExists)
            {
                return new CreateFolderResult(
                    null,
                    "ParentFolderNotFound");
            }
        }

        var folder = new Folder
        {
            WorldId = command.WorldId,
            ParentFolderId = command.ParentFolderId,
            Name = command.Name,
            Type = FolderType.Normal
        };

        _dbContext.Folders.Add(folder);
        await _dbContext.SaveChangesAsync(cancellationToken);

        var dto = new FolderDto(
            folder.Id,
            folder.WorldId,
            folder.ParentFolderId,
            folder.Name,
            folder.Type,
            folder.CreatedAt,
            folder.UpdatedAt);

        return new CreateFolderResult(dto, null);
    }
}