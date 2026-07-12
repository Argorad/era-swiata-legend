using EraSwiataLegend.Application.Worlds.DTOs;
using MediatR;

namespace EraSwiataLegend.Application.Worlds.Queries;

public record GetWorldsQuery : IRequest<List<WorldDto>>;