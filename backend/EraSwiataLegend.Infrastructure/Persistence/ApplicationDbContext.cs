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
    }

    public override Task<int> SaveChangesAsync(
        CancellationToken cancellationToken = default)
    {
        return base.SaveChangesAsync(cancellationToken);
    }
}