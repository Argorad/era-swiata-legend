using EraSwiataLegend.Application.Worlds.DTOs;

namespace EraSwiataLegend.Application.Worlds.Commands;

public sealed record CreateWorldCommand(
    string Name,
    string? Description
);