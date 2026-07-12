namespace EraSwiataLegend.Application.Pages.Commands;

public sealed record CreatePageCommand(
    Guid WorldId,
    Guid FolderId,
    string Title,
    string? Content
);