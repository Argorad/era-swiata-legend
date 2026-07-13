namespace EraSwiataLegend.Application.Search;

public sealed record SearchResultDto(
    string Type,
    Guid Id,
    Guid WorldId,
    Guid? FolderId,
    Guid? PageId,
    string Name,
    string Breadcrumb,
    string? Excerpt);
