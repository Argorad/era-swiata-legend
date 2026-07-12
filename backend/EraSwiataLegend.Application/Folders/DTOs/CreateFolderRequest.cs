namespace EraSwiataLegend.Application.Folders.DTOs;

public sealed record CreateFolderRequest(
    string Name,
    Guid? ParentFolderId
);