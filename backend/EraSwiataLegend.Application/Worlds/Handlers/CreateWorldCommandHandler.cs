using EraSwiataLegend.Application.Interfaces;
using EraSwiataLegend.Application.Worlds.Commands;
using EraSwiataLegend.Application.Worlds.DTOs;
using EraSwiataLegend.Domain.Entities;

namespace EraSwiataLegend.Application.Worlds.Handlers;

public sealed class CreateWorldCommandHandler
{
    private readonly IApplicationDbContext _dbContext;

    public CreateWorldCommandHandler(IApplicationDbContext dbContext)
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
            Description = command.Description ?? string.Empty
        };

        _dbContext.Worlds.Add(world);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new WorldDto(
            world.Id,
            world.Name,
            world.Description,
            world.CreatedAt,
            world.UpdatedAt
        );
    }
}