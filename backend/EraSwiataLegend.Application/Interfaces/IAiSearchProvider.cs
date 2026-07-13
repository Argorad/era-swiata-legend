namespace EraSwiataLegend.Application.Interfaces;

public sealed record AiSearchAnswer(
    string Answer,
    IReadOnlyList<Guid> RelatedPageIds);

public interface IAiSearchProvider
{
    bool IsConfigured { get; }

    string StatusMessage { get; }

    Task<AiSearchAnswer> SearchAsync(
        Guid? worldId,
        string question,
        CancellationToken cancellationToken);
}
