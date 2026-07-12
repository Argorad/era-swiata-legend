namespace EraSwiataLegend.Application.Folders.Commands;

public sealed record MoveFolderCommand(
    Guid WorldId,
    Guid FolderId,
    Guid? DestinationFolderId);