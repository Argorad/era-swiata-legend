using EraSwiataLegend.Application.Interfaces;
using EraSwiataLegend.Application.Pages.Commands;
using EraSwiataLegend.Application.Pages.DTOs;
using EraSwiataLegend.Domain.Entities;
using EraSwiataLegend.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace EraSwiataLegend.Application.Pages.Handlers;

public sealed class CreatePageCommandHandler
{
    private readonly IApplicationDbContext _dbContext;

    public CreatePageCommandHandler(IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<CreatePageResult> HandleAsync(
        CreatePageCommand command,
        CancellationToken cancellationToken = default)
    {
        var folderType = await _dbContext.Folders
            .Where(
                folder =>
                    folder.Id == command.FolderId &&
                    folder.WorldId == command.WorldId)
            .Select(folder => (FolderType?)folder.Type)
            .SingleOrDefaultAsync(cancellationToken);

        if (folderType is null)
        {
            return new CreatePageResult(
                null,
                "FolderNotFound");
        }

        if (folderType != FolderType.Normal)
        {
            return new CreatePageResult(
                null,
                "SystemFolderCannotContainNewPage");
        }

        var page = new Page
        {
            WorldId = command.WorldId,
            FolderId = command.FolderId,
            Title = command.Title,
            Content = command.Content ?? string.Empty
        };

        _dbContext.Pages.Add(page);
        await _dbContext.SaveChangesAsync(cancellationToken);

        var dto = new PageDto(
            page.Id,
            page.WorldId,
            page.FolderId,
            page.PreviousFolderId,
            page.Title,
            page.Content,
            page.CreatedAt,
            page.UpdatedAt);

        return new CreatePageResult(dto, null);
    }
}
