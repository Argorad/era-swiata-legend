using EraSwiataLegend.Domain.Enums;

namespace EraSwiataLegend.Application.Worlds.Commands;

public sealed record SetWorldStatusCommand(
    Guid WorldId,
    WorldStatus Status
);