using EraSwiataLegend.Domain.Enums;

namespace EraSwiataLegend.Application.Worlds.DTOs;

public sealed record WorldDto(
    Guid Id,
    string Name,
    string Description,
    WorldStatus Status,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);