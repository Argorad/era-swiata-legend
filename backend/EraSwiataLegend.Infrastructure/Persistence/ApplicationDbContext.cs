using EraSwiataLegend.Application.Interfaces;
using EraSwiataLegend.Domain.Entities;
using EraSwiataLegend.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace EraSwiataLegend.Infrastructure.Persistence;

public class ApplicationDbContext
    : DbContext, IApplicationDbContext
{
    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<World> Worlds => Set<World>();

    public DbSet<Folder> Folders => Set<Folder>();

    public DbSet<Page> Pages => Set<Page>();

    public DbSet<FileAttachment> FileAttachments =>
        Set<FileAttachment>();

    public DbSet<MapMarker> MapMarkers => Set<MapMarker>();

    public DbSet<WorldMap> WorldMaps => Set<WorldMap>();

    public DbSet<MarkerCategory> MarkerCategories =>
        Set<MarkerCategory>();

    public DbSet<MapImageLayer> MapImageLayers =>
        Set<MapImageLayer>();

    public DbSet<MapDrawingStroke> MapDrawingStrokes =>
        Set<MapDrawingStroke>();

    public DbSet<UserAccount> UserAccounts => Set<UserAccount>();

    protected override void OnModelCreating(
        ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<World>(entity =>
        {
            entity.Property(world => world.Name)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(world => world.Description)
                .HasMaxLength(4000);

            entity.Property(world => world.Status)
                .HasConversion<int>()
                .HasDefaultValue(WorldStatus.Active)
                .IsRequired();
        });

        modelBuilder.Entity<Folder>(entity =>
        {
            entity.Property(folder => folder.IsVisibleToPlayers)
                .HasDefaultValue(false);
            entity.Property(folder => folder.Name)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(folder => folder.Type)
                .HasConversion<int>()
                .HasDefaultValue(FolderType.Normal)
                .IsRequired();

            entity.HasOne(folder => folder.World)
                .WithMany(world => world.Folders)
                .HasForeignKey(folder => folder.WorldId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(folder => folder.ParentFolder)
                .WithMany(folder => folder.ChildFolders)
                .HasForeignKey(
                    folder => folder.ParentFolderId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Page>(entity =>
        {
            entity.Property(page => page.Title)
                .IsRequired()
                .HasMaxLength(300);

            entity.Property(page => page.Content)
                .IsRequired();

            entity.HasOne(page => page.World)
                .WithMany(world => world.Pages)
                .HasForeignKey(page => page.WorldId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(page => page.Folder)
                .WithMany(folder => folder.Pages)
                .HasForeignKey(page => page.FolderId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<FileAttachment>(entity =>
        {
            entity.Property(file => file.IsVisibleToPlayers)
                .HasDefaultValue(false);
            entity.Property(file => file.OriginalName)
                .IsRequired()
                .HasMaxLength(255);

            entity.Property(file => file.StoredName)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(file => file.ContentType)
                .IsRequired()
                .HasMaxLength(150);

            entity.HasIndex(file => file.StoredName)
                .IsUnique();

            entity.HasOne(file => file.World)
                .WithMany(world => world.Files)
                .HasForeignKey(file => file.WorldId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(file => file.Folder)
                .WithMany(folder => folder.Files)
                .HasForeignKey(file => file.FolderId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<MapMarker>(entity =>
        {
            entity.Property(marker => marker.AuthorDisplayName)
                .HasMaxLength(200);

            entity.Property(marker => marker.PlayerVisibility)
                .HasDefaultValue(0);

            entity.HasOne(marker => marker.OwnerUser)
                .WithMany()
                .HasForeignKey(marker => marker.OwnerUserId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.Property(marker => marker.Name)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(marker => marker.Description)
                .HasMaxLength(2000);

            entity.Property(marker => marker.Type)
                .HasConversion<int>()
                .IsRequired();

            entity.Property(marker => marker.Icon)
                .IsRequired()
                .HasMaxLength(40);

            entity.Property(marker => marker.Color)
                .IsRequired()
                .HasMaxLength(20);

            entity.Property(marker => marker.Status)
                .HasConversion<int>()
                .HasDefaultValue(MapMarkerStatus.Active)
                .IsRequired();

            entity.HasOne(marker => marker.World)
                .WithMany(world => world.MapMarkers)
                .HasForeignKey(marker => marker.WorldId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(marker => marker.Folder)
                .WithMany()
                .HasForeignKey(marker => marker.FolderId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(marker => marker.Page)
                .WithMany()
                .HasForeignKey(marker => marker.PageId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(marker => marker.Map)
                .WithMany(map => map.Markers)
                .HasForeignKey(marker => marker.MapId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(marker => marker.TargetMap)
                .WithMany()
                .HasForeignKey(marker => marker.TargetMapId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(marker => marker.Category)
                .WithMany(category => category.Markers)
                .HasForeignKey(marker => marker.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<WorldMap>(entity =>
        {
            entity.Property(map => map.CanvasBackground)
                .HasMaxLength(30)
                .HasDefaultValue("ocean");

            entity.Property(map => map.GridStyle)
                .HasMaxLength(20)
                .HasDefaultValue("lines");

            entity.Property(map => map.GridColor)
                .HasMaxLength(20)
                .HasDefaultValue("#9ed8e5");

            entity.Property(map => map.GridOpacity).HasDefaultValue(0.55);
            entity.Property(map => map.GridLineWidth).HasDefaultValue(1.5);
            entity.Property(map => map.GridMajorEvery).HasDefaultValue(5);
            entity.Property(map => map.IsGridMajorVisible).HasDefaultValue(true);
            entity.Property(map => map.IsDrawingLayerVisible).HasDefaultValue(true);
            entity.Property(map => map.IsDrawingLayerVisibleToPlayers).HasDefaultValue(false);
            entity.Property(map => map.Name)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(map => map.Description)
                .HasMaxLength(2000);

            entity.Property(map => map.Type)
                .HasConversion<int>()
                .IsRequired();

            entity.Property(map => map.Status)
                .HasConversion<int>()
                .HasDefaultValue(WorldMapStatus.Active)
                .IsRequired();

            entity.Property(map => map.GridSize)
                .HasDefaultValue(64)
                .IsRequired();

            entity.HasOne(map => map.World)
                .WithMany(world => world.Maps)
                .HasForeignKey(map => map.WorldId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(map => map.ImageFile)
                .WithMany()
                .HasForeignKey(map => map.ImageFileId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<MapImageLayer>(entity =>
        {
            entity.Property(layer => layer.Opacity).HasDefaultValue(1.0);
            entity.Property(layer => layer.Name).IsRequired().HasMaxLength(200);
            entity.HasIndex(layer => new { layer.MapId, layer.SortOrder });
            entity.HasOne(layer => layer.World).WithMany(world => world.MapImageLayers)
                .HasForeignKey(layer => layer.WorldId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(layer => layer.Map).WithMany(map => map.ImageLayers)
                .HasForeignKey(layer => layer.MapId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(layer => layer.FileAttachment).WithMany()
                .HasForeignKey(layer => layer.FileAttachmentId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<MapDrawingStroke>(entity =>
        {
            entity.Property(stroke => stroke.Tool).IsRequired().HasMaxLength(20).HasDefaultValue("pen");
            entity.Property(stroke => stroke.FillColor).IsRequired().HasMaxLength(20).HasDefaultValue("transparent");
            entity.Property(stroke => stroke.HasTextBorder).HasDefaultValue(true);
            entity.Property(stroke => stroke.Opacity).HasDefaultValue(1.0);
            entity.Property(stroke => stroke.DashStyle).IsRequired().HasMaxLength(20).HasDefaultValue("solid");
            entity.Property(stroke => stroke.Text).IsRequired().HasDefaultValue("");
            entity.Property(stroke => stroke.FontSize).HasDefaultValue(24.0);
            entity.Property(stroke => stroke.IsVisible).HasDefaultValue(true);
            entity.Property(stroke => stroke.Color).IsRequired().HasMaxLength(20);
            entity.Property(stroke => stroke.PointsJson).IsRequired();
            entity.HasIndex(stroke => new { stroke.MapId, stroke.CreatedAt });
            entity.HasOne(stroke => stroke.World).WithMany(world => world.MapDrawingStrokes)
                .HasForeignKey(stroke => stroke.WorldId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(stroke => stroke.Map).WithMany(map => map.DrawingStrokes)
                .HasForeignKey(stroke => stroke.MapId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<MarkerCategory>(entity =>
        {
            entity.Property(category => category.Name)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(category => category.Icon)
                .IsRequired()
                .HasMaxLength(40);

            entity.Property(category => category.Color)
                .IsRequired()
                .HasMaxLength(20);

            entity.HasIndex(category => new
            {
                category.WorldId,
                category.Name
            }).IsUnique();

            entity.HasOne(category => category.World)
                .WithMany(world => world.MarkerCategories)
                .HasForeignKey(category => category.WorldId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<UserAccount>(entity =>
        {
            entity.Property(user => user.ExternalSubject)
                .IsRequired()
                .HasMaxLength(300);

            entity.Property(user => user.DisplayName)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(user => user.Email)
                .HasMaxLength(320);

            entity.Property(user => user.NormalizedEmail)
                .HasMaxLength(320);

            entity.Property(user => user.NormalizedDisplayName)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(user => user.PasswordHash)
                .IsRequired()
                .HasMaxLength(1000);

            entity.Property(user => user.SecurityStamp)
                .IsRequired()
                .HasMaxLength(64);

            entity.Property(user => user.Role)
                .HasConversion<int>()
                .IsRequired();

            entity.HasIndex(user => user.ExternalSubject)
                .IsUnique();

            entity.HasIndex(user => user.NormalizedDisplayName)
                .IsUnique();

            entity.HasIndex(user => user.NormalizedEmail)
                .IsUnique();
        });
    }

    public override Task<int> SaveChangesAsync(
        CancellationToken cancellationToken = default)
    {
        return base.SaveChangesAsync(cancellationToken);
    }
}
