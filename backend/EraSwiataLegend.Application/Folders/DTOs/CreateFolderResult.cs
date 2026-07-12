namespace EraSwiataLegend.Application.Folders.DTOs;

public sealed record CreateFolderResult(
    FolderDto? Folder,
    string? Error
);