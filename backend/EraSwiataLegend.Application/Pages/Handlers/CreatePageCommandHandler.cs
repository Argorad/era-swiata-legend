using EraSwiataLegend.Application.Interfaces;
using EraSwiataLegend.Application.Pages.Commands;
using EraSwiataLegend.Application.Pages.DTOs;
using EraSwiataLegend.Domain.Entities;
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
        var folderExists = await _dbContext.Folders
            .AnyAsync(
                folder =>
                    folder.Id == command.FolderId &&
                    folder.WorldId == command.WorldId,
                cancellationToken);

        if (!folderExists)
        {
            return new CreatePageResult(
                null,
                "FolderNotFound");
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
            page.Title,
            page.Content,
            page.CreatedAt,
            page.UpdatedAt);

        return new CreatePageResult(dto, null);
    }
}