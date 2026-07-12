using EraSwiataLegend.Application.Folders.DTOs;
using EraSwiataLegend.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EraSwiataLegend.Application.Folders.Handlers;

public sealed class GetFoldersQueryHandler
{
    private readonly IApplicationDbContext _dbContext;

    public GetFoldersQueryHandler(IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<FolderDto>> HandleAsync(
        Guid worldId,
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.Folders
            .AsNoTracking()
            .Where(folder => folder.WorldId == worldId)
            .OrderBy(folder => folder.Name)
            .Select(folder => new FolderDto(
                folder.Id,
                folder.WorldId,
                folder.ParentFolderId,
                folder.Name,
                folder.CreatedAt,
                folder.UpdatedAt))
            .ToListAsync(cancellationToken);
    }
}