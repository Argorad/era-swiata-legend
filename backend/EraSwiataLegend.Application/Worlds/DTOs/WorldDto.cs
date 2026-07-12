namespace EraSwiataLegend.Application.Worlds.DTOs;

public sealed record WorldDto(
    Guid Id,
    string Name,
    string Description,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);