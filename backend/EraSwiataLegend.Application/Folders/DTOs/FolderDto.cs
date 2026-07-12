namespace EraSwiataLegend.Application.Folders.DTOs;

public sealed record FolderDto(
    Guid Id,
    Guid WorldId,
    Guid? ParentFolderId,
    string Name,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);