using EraSwiataLegend.Application.Interfaces;
using Microsoft.Extensions.Options;

namespace EraSwiataLegend.Infrastructure.Files;

public sealed class LocalFileStorage : IFileStorage
{
    private readonly string _rootPath;

    public LocalFileStorage(
        IOptions<FileStorageOptions> options)
    {
        _rootPath = Path.GetFullPath(options.Value.RootPath);
        Directory.CreateDirectory(_rootPath);
    }

    public async Task<string> SaveAsync(
        Stream source,
        string extension,
        CancellationToken cancellationToken)
    {
        var storedName = $"{Guid.NewGuid():N}{extension}";
        var path = GetSafePath(storedName);

        await using var destination = new FileStream(
            path,
            FileMode.CreateNew,
            FileAccess.Write,
            FileShare.None,
            81920,
            FileOptions.Asynchronous);

        await source.CopyToAsync(destination, cancellationToken);

        return storedName;
    }

    public Task<Stream?> OpenReadAsync(
        string storedName,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var path = GetSafePath(storedName);

        Stream? stream = File.Exists(path)
            ? new FileStream(
                path,
                FileMode.Open,
                FileAccess.Read,
                FileShare.Read,
                81920,
                FileOptions.Asynchronous)
            : null;

        return Task.FromResult(stream);
    }

    public Task DeleteAsync(
        string storedName,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var path = GetSafePath(storedName);

        if (File.Exists(path))
        {
            File.Delete(path);
        }

        return Task.CompletedTask;
    }

    private string GetSafePath(string storedName)
    {
        if (string.IsNullOrWhiteSpace(storedName) ||
            Path.GetFileName(storedName) != storedName)
        {
            throw new InvalidOperationException(
                "Nieprawidłowa nazwa pliku w magazynie.");
        }

        var path = Path.GetFullPath(
            Path.Combine(_rootPath, storedName));
        var rootPrefix = _rootPath.TrimEnd(
            Path.DirectorySeparatorChar) +
            Path.DirectorySeparatorChar;

        if (!path.StartsWith(
                rootPrefix,
                StringComparison.Ordinal))
        {
            throw new InvalidOperationException(
                "Ścieżka pliku wykracza poza magazyn.");
        }

        return path;
    }
}
