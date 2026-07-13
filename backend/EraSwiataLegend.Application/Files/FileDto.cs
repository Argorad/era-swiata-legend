namespace EraSwiataLegend.Application.Files;

public sealed record FileDto(
    Guid Id,
    Guid WorldId,
    Guid FolderId,
    Guid? PreviousFolderId,
    string OriginalName,
    long Size,
    string ContentType,
    bool IsVisibleToPlayers,
    DateTime CreatedAt,
    DateTime? UpdatedAt);

public sealed record FileOperationResult(
    FileDto? File,
    string? Error);

public sealed record StoredFileContent(
    Stream Stream,
    string ContentType,
    string DownloadName);

public sealed record RestoreFileRequest(
    Guid? DestinationFolderId);
