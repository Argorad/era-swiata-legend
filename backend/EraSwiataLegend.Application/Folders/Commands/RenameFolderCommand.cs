namespace EraSwiataLegend.Application.Folders.Commands;

public sealed record RenameFolderCommand(
    Guid WorldId,
    Guid FolderId,
    string Name);