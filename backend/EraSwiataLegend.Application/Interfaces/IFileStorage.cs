namespace EraSwiataLegend.Application.Interfaces;

public interface IFileStorage
{
    Task<string> SaveAsync(
        Stream source,
        string extension,
        CancellationToken cancellationToken);

    Task<Stream?> OpenReadAsync(
        string storedName,
        CancellationToken cancellationToken);

    Task DeleteAsync(
        string storedName,
        CancellationToken cancellationToken);
}
