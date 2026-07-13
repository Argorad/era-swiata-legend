using EraSwiataLegend.Domain.Common;

namespace EraSwiataLegend.Domain.Entities;

public class MarkerCategory : BaseEntity
{
    public Guid WorldId { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Icon { get; set; } = "◆";

    public string Color { get; set; } = "#b98a45";

    public int SortOrder { get; set; }

    public bool IsActive { get; set; } = true;

    public World World { get; set; } = null!;

    public ICollection<MapMarker> Markers { get; set; } =
        new List<MapMarker>();

    public void Update(
        string name,
        string icon,
        string color,
        int sortOrder,
        bool isActive)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException(
                "Nazwa kategorii jest wymagana.",
                nameof(name));
        }

        Name = name.Trim();
        Icon = string.IsNullOrWhiteSpace(icon) ? "◆" : icon.Trim();
        Color = color.Trim();
        SortOrder = sortOrder;
        IsActive = isActive;
        UpdatedAt = DateTime.UtcNow;
    }
}
