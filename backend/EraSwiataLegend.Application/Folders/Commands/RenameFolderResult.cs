using EraSwiataLegend.Application.Folders.DTOs;

namespace EraSwiataLegend.Application.Folders.Commands;

public sealed record RenameFolderResult(
    FolderDto? Folder,
    string? Error);