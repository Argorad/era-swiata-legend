using EraSwiataLegend.Domain.Enums;

namespace EraSwiataLegend.Application.Folders.DTOs;

public sealed record FolderDto(
    Guid Id,
    Guid WorldId,
    Guid? ParentFolderId,
    string Name,
    FolderType Type,
    DateTime CreatedAt,
    DateTime? UpdatedAt);