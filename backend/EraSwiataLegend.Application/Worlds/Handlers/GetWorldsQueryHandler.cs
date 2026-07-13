using EraSwiataLegend.Application.Interfaces;
using EraSwiataLegend.Application.Worlds.DTOs;
using EraSwiataLegend.Application.Worlds.Queries;
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
        return await GetWorldsAsync(cancellationToken);
    }

    private async Task<List<WorldDto>> GetWorldsAsync(
        CancellationToken cancellationToken)
    {
        return await _context.Worlds
            .AsNoTracking()
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