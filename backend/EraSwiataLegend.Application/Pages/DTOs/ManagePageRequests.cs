namespace EraSwiataLegend.Application.Pages.DTOs;

public sealed record UpdatePageRequest(
    string Title,
    string? Content);

public sealed record MovePageRequest(
    Guid DestinationFolderId);

public sealed record RestorePageRequest(
    Guid? DestinationFolderId);
