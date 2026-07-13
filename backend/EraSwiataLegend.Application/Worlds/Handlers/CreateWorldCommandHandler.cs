using EraSwiataLegend.Application.Interfaces;
using EraSwiataLegend.Application.Worlds.Commands;
using EraSwiataLegend.Application.Worlds.DTOs;
using EraSwiataLegend.Domain.Entities;
using EraSwiataLegend.Domain.Enums;

namespace EraSwiataLegend.Application.Worlds.Handlers;

public sealed class CreateWorldCommandHandler
{
    private readonly IApplicationDbContext _dbContext;

    public CreateWorldCommandHandler(
        IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<WorldDto> HandleAsync(
        CreateWorldCommand command,
        CancellationToken cancellationToken = default)
    {
        var world = new World
        {
            Name = command.Name,
            Description =
                command.Description ?? string.Empty
        };

        var archiveFolder = new Folder
        {
            World = world,
            Name = "Archive",
            Type = FolderType.Archive
        };

        var trashFolder = new Folder
        {
            World = world,
            Name = "Trash",
            Type = FolderType.Trash
        };

        world.Folders.Add(archiveFolder);
        world.Folders.Add(trashFolder);

        _dbContext.Worlds.Add(world);

        await _dbContext.SaveChangesAsync(
            cancellationToken);

        return new WorldDto(
            world.Id,
            world.Name,
            world.Description,
            world.Status,
            world.CreatedAt,
            world.UpdatedAt);
    }
}