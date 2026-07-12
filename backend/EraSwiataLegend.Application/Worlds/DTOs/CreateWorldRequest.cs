namespace EraSwiataLegend.Application.Worlds.DTOs;

public sealed record CreateWorldRequest(
    string Name,
    string? Description
);