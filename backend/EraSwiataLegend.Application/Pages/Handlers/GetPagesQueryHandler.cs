using EraSwiataLegend.Application.Interfaces;
using EraSwiataLegend.Application.Pages.DTOs;
using Microsoft.EntityFrameworkCore;

namespace EraSwiataLegend.Application.Pages.Handlers;

public sealed class GetPagesQueryHandler
{
    private readonly IApplicationDbContext _dbContext;

    public GetPagesQueryHandler(IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<PageDto>> HandleAsync(
        Guid worldId,
        Guid folderId,
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.Pages
            .AsNoTracking()
            .Where(page =>
                page.WorldId == worldId &&
                page.FolderId == folderId)
            .OrderBy(page => page.Title)
            .Select(page => new PageDto(
                page.Id,
                page.WorldId,
                page.FolderId,
                page.Title,
                page.Content,
                page.CreatedAt,
                page.UpdatedAt))
            .ToListAsync(cancellationToken);
    }
}