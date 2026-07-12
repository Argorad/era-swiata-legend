namespace EraSwiataLegend.Application.Folders.Commands;

public sealed record CreateFolderCommand(
    Guid WorldId,
    string Name,
    Guid? ParentFolderId
);