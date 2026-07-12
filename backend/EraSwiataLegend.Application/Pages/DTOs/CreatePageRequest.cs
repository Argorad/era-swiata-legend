namespace EraSwiataLegend.Application.Pages.DTOs;

public sealed record CreatePageRequest(
    string Title,
    string? Content
);