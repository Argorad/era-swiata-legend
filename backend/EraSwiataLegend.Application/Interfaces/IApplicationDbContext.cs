using EraSwiataLegend.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace EraSwiataLegend.Application.Interfaces;

public interface IApplicationDbContext
{
    DbSet<World> Worlds { get; }

    DbSet<Folder> Folders { get; }

    DbSet<Page> Pages { get; }

    DbSet<FileAttachment> FileAttachments { get; }

    DbSet<MapMarker> MapMarkers { get; }

    DbSet<WorldMap> WorldMaps { get; }

    DbSet<MarkerCategory> MarkerCategories { get; }

    DbSet<MapImageLayer> MapImageLayers { get; }

    DbSet<MapDrawingStroke> MapDrawingStrokes { get; }

    DbSet<UserAccount> UserAccounts { get; }

    Task<int> SaveChangesAsync(
        CancellationToken cancellationToken = default);
}
