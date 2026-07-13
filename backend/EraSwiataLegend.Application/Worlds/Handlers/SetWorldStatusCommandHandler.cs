using EraSwiataLegend.Application.Interfaces;
using EraSwiataLegend.Application.Worlds.Commands;
using EraSwiataLegend.Application.Worlds.DTOs;
using EraSwiataLegend.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace EraSwiataLegend.Application.Worlds.Handlers;

public sealed class SetWorldStatusCommandHandler
{
    private readonly IApplicationDbContext _dbContext;

    public SetWorldStatusCommandHandler(
        IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<WorldDto?> HandleAsync(
        SetWorldStatusCommand command,
        CancellationToken cancellationToken = default)
    {
        var world = await _dbContext.Worlds
            .SingleOrDefaultAsync(
                item => item.Id == command.WorldId,
                cancellationToken);

        if (world is null)
        {
            return null;
        }

        switch (command.Status)
        {
            case WorldStatus.Active:
                world.Restore();
                break;

            case WorldStatus.Archived:
                world.Archive();
                break;

            default:
                throw new ArgumentOutOfRangeException(
                    nameof(command.Status),
                    command.Status,
                    "Nieobsługiwany status świata.");
        }

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