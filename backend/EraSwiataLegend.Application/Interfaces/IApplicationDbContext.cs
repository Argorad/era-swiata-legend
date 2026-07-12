using EraSwiataLegend.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace EraSwiataLegend.Application.Interfaces;

public interface IApplicationDbContext
{
    DbSet<World> Worlds { get; }

    DbSet<Folder> Folders { get; }

    DbSet<Page> Pages { get; }

    Task<int> SaveChangesAsync(
        CancellationToken cancellationToken = default);
}