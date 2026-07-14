using EraSwiataLegend.Application.Interfaces;
using EraSwiataLegend.Application.Worlds.DTOs;
using EraSwiataLegend.Application.Worlds.Queries;
using EraSwiataLegend.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace EraSwiataLegend.Application.Worlds.Handlers;

public sealed class GetWorldsQueryHandler
    : IRequestHandler<GetWorldsQuery, List<WorldDto>>
{
    private readonly IApplicationDbContext _context;

    public GetWorldsQueryHandler(
        IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<WorldDto>> Handle(
        GetWorldsQuery request,
        CancellationToken cancellationToken)
    {
        return await GetWorldsAsync(cancellationToken);
    }

    public async Task<List<WorldDto>> HandleAsync(
        CancellationToken cancellationToken = default)
    {
        return await GetWorldsAsync(false, cancellationToken);
    }

    public async Task<List<WorldDto>> HandleAsync(
        bool playerView,
        CancellationToken cancellationToken = default)
    {
        return await GetWorldsAsync(playerView, cancellationToken);
    }

    private async Task<List<WorldDto>> GetWorldsAsync(
        bool playerView,
        CancellationToken cancellationToken)
    {
        return await _context.Worlds
            .AsNoTracking()
            .Where(world =>
                !playerView ||
                world.Status == WorldStatus.Active)
            .OrderBy(world => world.Status)
            .ThenBy(world => world.Name)
            .Select(world => new WorldDto(
                world.Id,
                world.Name,
                world.Description,
                world.Status,
                world.CreatedAt,
                world.UpdatedAt
            ))
            .ToListAsync(cancellationToken);
    }
}
