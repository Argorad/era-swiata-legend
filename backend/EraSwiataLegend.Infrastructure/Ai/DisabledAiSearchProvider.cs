using EraSwiataLegend.Application.Interfaces;
using Microsoft.Extensions.Configuration;

namespace EraSwiataLegend.Infrastructure.Ai;

public sealed class DisabledAiSearchProvider : IAiSearchProvider
{
    private readonly IConfiguration _configuration;

    public DisabledAiSearchProvider(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public bool IsConfigured => false;

    public string StatusMessage =>
        string.IsNullOrWhiteSpace(
            _configuration["Ai:ApiKey"])
            ? "Wyszukiwanie AI wymaga klucza w zmiennej Ai__ApiKey oraz implementacji adaptera dostawcy."
            : "Klucz AI jest dostępny, ale adapter dostawcy nie został jeszcze wybrany i włączony.";

    public Task<AiSearchAnswer> SearchAsync(
        Guid? worldId,
        string question,
        CancellationToken cancellationToken)
    {
        throw new InvalidOperationException(StatusMessage);
    }
}
