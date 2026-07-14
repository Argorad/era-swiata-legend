using EraSwiataLegend.Application.Interfaces;
using EraSwiataLegend.Domain.Entities;
using EraSwiataLegend.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace EraSwiataLegend.Application.Files;

public sealed class FileLibraryService
{
    public const long MaximumFileSize = 20 * 1024 * 1024;
    public const long MaximumMapImageSize = 50 * 1024 * 1024;

    private sealed record FolderVisibility(
        Guid Id,
        Guid? ParentFolderId,
        bool IsVisibleToPlayers);

    private static readonly HashSet<string> AllowedExtensions =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ".pdf", ".txt", ".md", ".png", ".jpg",
            ".jpeg", ".webp", ".gif", ".docx", ".xlsx"
        };

    private static readonly HashSet<string> AllowedContentTypes =
        new(StringComparer.OrdinalIgnoreCase)
        {
            "application/octet-stream",
            "application/pdf",
            "text/plain",
            "text/markdown",
            "image/png",
            "image/jpeg",
            "image/webp",
            "image/gif",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        };

    private readonly IApplicationDbContext _dbContext;
    private readonly IFileStorage _fileStorage;

    public FileLibraryService(
        IApplicationDbContext dbContext,
        IFileStorage fileStorage)
    {
        _dbContext = dbContext;
        _fileStorage = fileStorage;
    }

    public Task<List<FileDto>> GetFilesAsync(
        Guid worldId,
        Guid folderId,
        CancellationToken cancellationToken)
        => GetFilesAsync(worldId, folderId, false, cancellationToken);

    public async Task<List<FileDto>> GetFilesAsync(
        Guid worldId,
        Guid folderId,
        bool playerView,
        CancellationToken cancellationToken)
    {
        var files = await _dbContext.FileAttachments
            .AsNoTracking()
            .Where(file =>
                file.WorldId == worldId &&
                file.FolderId == folderId)
            .OrderBy(file => file.OriginalName)
            .Select(file => new FileDto(
                file.Id,
                file.WorldId,
                file.FolderId,
                file.PreviousFolderId,
                file.OriginalName,
                file.Size,
                file.ContentType,
                file.IsVisibleToPlayers,
                file.CreatedAt,
                file.UpdatedAt))
            .ToListAsync(cancellationToken);

        if (!playerView)
        {
            return files;
        }

        var folders = await _dbContext.Folders
            .AsNoTracking()
            .Where(folder => folder.WorldId == worldId)
            .Select(folder => new FolderVisibility(
                folder.Id,
                folder.ParentFolderId,
                folder.IsVisibleToPlayers))
            .ToDictionaryAsync(folder => folder.Id, cancellationToken);

        return files.Where(file =>
            IsVisibleToPlayer(file.FolderId, folders)).ToList();
    }

    public Task<List<FileDto>> GetMapImagesAsync(
        Guid worldId,
        CancellationToken cancellationToken) =>
        GetMapImagesAsync(worldId, false, cancellationToken);

    public async Task<List<FileDto>> GetMapImagesAsync(
        Guid worldId,
        bool playerView,
        CancellationToken cancellationToken)
    {
        var images = await _dbContext.FileAttachments
            .AsNoTracking()
            .Where(file =>
                file.WorldId == worldId &&
                file.Folder.Type != FolderType.Trash &&
                (file.ContentType == "image/png" ||
                 file.ContentType == "image/jpeg" ||
                 file.ContentType == "image/webp" ||
                 file.ContentType == "image/avif"))
            .OrderBy(file => file.OriginalName)
            .Select(file => new FileDto(
                file.Id, file.WorldId, file.FolderId,
                file.PreviousFolderId, file.OriginalName,
                file.Size, file.ContentType, file.IsVisibleToPlayers,
                file.CreatedAt, file.UpdatedAt))
            .ToListAsync(cancellationToken);

        if (!playerView)
        {
            return images;
        }

        var folders = await _dbContext.Folders
            .AsNoTracking()
            .Where(folder => folder.WorldId == worldId)
            .Select(folder => new FolderVisibility(
                folder.Id,
                folder.ParentFolderId,
                folder.IsVisibleToPlayers))
            .ToDictionaryAsync(folder => folder.Id, cancellationToken);

        return images.Where(file =>
            file.IsVisibleToPlayers &&
            IsVisibleToPlayer(file.FolderId, folders)).ToList();
    }

    public async Task<FileOperationResult> UploadMapImageAsync(
        Guid worldId,
        Guid folderId,
        string originalName,
        long size,
        Stream source,
        CancellationToken cancellationToken)
    {
        var safeName = Path.GetFileName(originalName).Trim();
        var extension = Path.GetExtension(safeName).ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(safeName) || safeName.Length > 255 ||
            size <= 0 || size > MaximumMapImageSize)
        {
            return new(null, size > MaximumMapImageSize ? "InvalidFileSize" : "InvalidFileName");
        }

        var folderType = await _dbContext.Folders
            .Where(folder => folder.Id == folderId && folder.WorldId == worldId)
            .Select(folder => (FolderType?)folder.Type)
            .SingleOrDefaultAsync(cancellationToken);
        if (folderType is null) return new(null, "FolderNotFound");
        if (folderType != FolderType.Normal) return new(null, "SystemFolderCannotContainNewFile");

        await using var buffer = new MemoryStream((int)Math.Min(size, int.MaxValue));
        await source.CopyToAsync(buffer, cancellationToken);
        var detectedType = DetectMapImageType(buffer.GetBuffer().AsSpan(0, checked((int)buffer.Length)));
        var extensionMatches = detectedType switch
        {
            "image/png" => extension == ".png",
            "image/jpeg" => extension is ".jpg" or ".jpeg",
            "image/webp" => extension == ".webp",
            "image/avif" => extension == ".avif",
            _ => false
        };
        if (!extensionMatches) return new(null, "FileTypeNotAllowed");

        buffer.Position = 0;
        var storedName = await _fileStorage.SaveAsync(buffer, extension, cancellationToken);
        var attachment = new FileAttachment
        {
            WorldId = worldId,
            FolderId = folderId,
            OriginalName = safeName,
            StoredName = storedName,
            Size = buffer.Length,
            ContentType = detectedType!
        };
        try
        {
            _dbContext.FileAttachments.Add(attachment);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch
        {
            await _fileStorage.DeleteAsync(storedName, CancellationToken.None);
            throw;
        }

        return new(ToDto(attachment), null);
    }

    private static string? DetectMapImageType(ReadOnlySpan<byte> data)
    {
        if (data.Length >= 8 && data[..8].SequenceEqual(new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 })) return "image/png";
        if (data.Length >= 3 && data[0] == 255 && data[1] == 216 && data[2] == 255) return "image/jpeg";
        if (data.Length >= 12 && data[..4].SequenceEqual("RIFF"u8) && data.Slice(8, 4).SequenceEqual("WEBP"u8)) return "image/webp";
        if (data.Length >= 12 && data.Slice(4, 4).SequenceEqual("ftyp"u8) &&
            (data.Slice(8, 4).SequenceEqual("avif"u8) || data.Slice(8, 4).SequenceEqual("avis"u8))) return "image/avif";
        return null;
    }

    public async Task<FileOperationResult> UploadAsync(
        Guid worldId,
        Guid folderId,
        string originalName,
        string contentType,
        long size,
        Stream source,
        CancellationToken cancellationToken)
    {
        var safeOriginalName = Path.GetFileName(originalName).Trim();
        var extension = Path.GetExtension(safeOriginalName);

        if (string.IsNullOrWhiteSpace(safeOriginalName) ||
            safeOriginalName.Length > 255)
        {
            return new(null, "InvalidFileName");
        }

        if (size <= 0 || size > MaximumFileSize)
        {
            return new(null, "InvalidFileSize");
        }

        if (!AllowedExtensions.Contains(extension) ||
            (!string.IsNullOrWhiteSpace(contentType) &&
             !AllowedContentTypes.Contains(contentType)))
        {
            return new(null, "FileTypeNotAllowed");
        }

        var folderType = await _dbContext.Folders
            .Where(folder =>
                folder.Id == folderId &&
                folder.WorldId == worldId)
            .Select(folder => (FolderType?)folder.Type)
            .SingleOrDefaultAsync(cancellationToken);

        if (folderType is null)
        {
            return new(null, "FolderNotFound");
        }

        if (folderType != FolderType.Normal)
        {
            return new(null, "SystemFolderCannotContainNewFile");
        }

        var storedName = await _fileStorage.SaveAsync(
            source,
            extension.ToLowerInvariant(),
            cancellationToken);

        var attachment = new FileAttachment
        {
            WorldId = worldId,
            FolderId = folderId,
            OriginalName = safeOriginalName,
            StoredName = storedName,
            Size = size,
            ContentType = NormalizeContentType(contentType)
        };

        try
        {
            _dbContext.FileAttachments.Add(attachment);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch
        {
            await _fileStorage.DeleteAsync(
                storedName,
                CancellationToken.None);
            throw;
        }

        return new(ToDto(attachment), null);
    }

    public async Task<StoredFileContent?> OpenAsync(
        Guid worldId,
        Guid fileId,
        CancellationToken cancellationToken)
    {
        var file = await _dbContext.FileAttachments
            .AsNoTracking()
            .FirstOrDefaultAsync(
                item =>
                    item.Id == fileId &&
                    item.WorldId == worldId,
                cancellationToken);

        if (file is null)
        {
            return null;
        }

        var stream = await _fileStorage.OpenReadAsync(
            file.StoredName,
            cancellationToken);

        return stream is null
            ? null
            : new StoredFileContent(
                stream,
                file.ContentType,
                file.OriginalName);
    }

    public async Task<StoredFileContent?> OpenForPlayerAsync(
        Guid worldId,
        Guid fileId,
        CancellationToken cancellationToken)
    {
        var file = await _dbContext.FileAttachments.AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == fileId && item.WorldId == worldId,
                cancellationToken);
        if (file is null || !file.IsVisibleToPlayers) return null;

        var folders = await _dbContext.Folders.AsNoTracking()
            .Where(folder => folder.WorldId == worldId)
            .Select(folder => new { folder.Id, folder.ParentFolderId, folder.IsVisibleToPlayers })
            .ToDictionaryAsync(folder => folder.Id, cancellationToken);
        var current = (Guid?)file.FolderId;
        var visited = new HashSet<Guid>();
        while (current.HasValue)
        {
            if (!visited.Add(current.Value) || !folders.TryGetValue(current.Value, out var folder) ||
                !folder.IsVisibleToPlayers) return null;
            current = folder.ParentFolderId;
        }

        return await OpenAsync(worldId, fileId, cancellationToken);
    }

    public async Task<StoredFileContent?> OpenMapImageAsync(
        Guid worldId, Guid mapId, Guid fileId, bool playerView,
        CancellationToken cancellationToken)
    {
        var allowed = await _dbContext.WorldMaps.AsNoTracking()
            .AnyAsync(map => map.Id == mapId && map.WorldId == worldId &&
                (!playerView || (map.IsPublished && map.Status == WorldMapStatus.Active)) &&
                (map.ImageFileId == fileId || map.ImageLayers.Any(layer =>
                    layer.FileAttachmentId == fileId && layer.IsVisible &&
                    (!playerView || layer.IsVisibleToPlayers))), cancellationToken);
        return allowed ? await OpenAsync(worldId, fileId, cancellationToken) : null;
    }

    public async Task<FileOperationResult> MoveToTrashAsync(
        Guid worldId,
        Guid fileId,
        CancellationToken cancellationToken)
    {
        var file = await FindFileAsync(
            worldId,
            fileId,
            cancellationToken);

        if (file is null)
        {
            return new(null, "FileNotFound");
        }

        var trashFolderId = await _dbContext.Folders
            .Where(folder =>
                folder.WorldId == worldId &&
                folder.Type == FolderType.Trash)
            .Select(folder => (Guid?)folder.Id)
            .SingleOrDefaultAsync(cancellationToken);

        if (trashFolderId is null)
        {
            return new(null, "TrashNotFound");
        }

        if (file.FolderId != trashFolderId.Value)
        {
            file.MoveToTrash(trashFolderId.Value);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        return new(ToDto(file), null);
    }

    public async Task<FileOperationResult> RestoreAsync(
        Guid worldId,
        Guid fileId,
        Guid? destinationFolderId,
        CancellationToken cancellationToken)
    {
        var file = await FindFileAsync(
            worldId,
            fileId,
            cancellationToken);

        if (file is null)
        {
            return new(null, "FileNotFound");
        }

        var restoreFolderId =
            destinationFolderId ?? file.PreviousFolderId;

        if (restoreFolderId is null)
        {
            return new(null, "RestoreDestinationNotFound");
        }

        var destinationIsValid = await _dbContext.Folders.AnyAsync(
            folder =>
                folder.Id == restoreFolderId.Value &&
                folder.WorldId == worldId &&
                folder.Type == FolderType.Normal,
            cancellationToken);

        if (!destinationIsValid)
        {
            return new(null, "RestoreDestinationNotFound");
        }

        file.RestoreTo(restoreFolderId.Value);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new(ToDto(file), null);
    }

    private Task<FileAttachment?> FindFileAsync(
        Guid worldId,
        Guid fileId,
        CancellationToken cancellationToken) =>
        _dbContext.FileAttachments.FirstOrDefaultAsync(
            file =>
                file.Id == fileId &&
                file.WorldId == worldId,
            cancellationToken);

    private static string NormalizeContentType(string contentType)
    {
        if (string.IsNullOrWhiteSpace(contentType) ||
            contentType.Length > 150 ||
            contentType.Any(char.IsControl))
        {
            return "application/octet-stream";
        }

        return contentType.Trim();
    }

    private static bool IsVisibleToPlayer(
        Guid folderId,
        IReadOnlyDictionary<Guid, FolderVisibility> folders)
    {
        var current = folderId;
        var visited = new HashSet<Guid>();

        while (visited.Add(current))
        {
            if (!folders.TryGetValue(current, out var folder) ||
                !folder.IsVisibleToPlayers)
            {
                return false;
            }

            if (folder.ParentFolderId is null)
            {
                return true;
            }

            current = folder.ParentFolderId;
        }

        return false;
    }

    private static FileDto ToDto(FileAttachment file) =>
        new(
            file.Id,
            file.WorldId,
            file.FolderId,
            file.PreviousFolderId,
            file.OriginalName,
            file.Size,
            file.ContentType,
            file.IsVisibleToPlayers,
            file.CreatedAt,
            file.UpdatedAt);
}
