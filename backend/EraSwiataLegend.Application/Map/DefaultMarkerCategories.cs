namespace EraSwiataLegend.Application.Map;

public sealed record DefaultMarkerCategory(
    string Name,
    string Icon,
    string Color);

public static class DefaultMarkerCategories
{
    public static IReadOnlyList<DefaultMarkerCategory> All { get; } =
    [
        new("Miasta", "♜", "#c58b4b"),
        new("Wioski", "⌂", "#9d7d4e"),
        new("Ruiny", "◫", "#817a72"),
        new("Lochy", "▣", "#654b66"),
        new("NPC", "♟", "#4f8191"),
        new("Organizacje", "⚜", "#8e5f85"),
        new("Bitwy", "⚔", "#a4433f"),
        new("Skarby", "◆", "#c3a23e"),
        new("Portale", "◉", "#6954a3"),
        new("Zadania", "✦", "#4f8a67")
    ];
}
