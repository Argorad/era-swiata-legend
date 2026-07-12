namespace EraSwiataLegend.Application.Pages.DTOs;

public sealed record CreatePageResult(
    PageDto? Page,
    string? Error
);