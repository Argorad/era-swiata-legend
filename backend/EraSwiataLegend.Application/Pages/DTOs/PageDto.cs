namespace EraSwiataLegend.Application.Pages.DTOs;

public sealed record PageDto(
    Guid Id,
    Guid WorldId,
    Guid FolderId,
    Guid? PreviousFolderId,
    string Title,
    string Content,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);
