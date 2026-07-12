namespace EraSwiataLegend.Application.Folders.Commands;

public sealed record MoveFolderRequest(
    Guid? DestinationFolderId);