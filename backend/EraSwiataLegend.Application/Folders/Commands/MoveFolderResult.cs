using EraSwiataLegend.Application.Folders.DTOs;

namespace EraSwiataLegend.Application.Folders.Commands;

public sealed record MoveFolderResult(
    FolderDto? Folder,
    string? Error);