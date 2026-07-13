using EraSwiataLegend.Domain.Common;
using EraSwiataLegend.Domain.Enums;

namespace EraSwiataLegend.Domain.Entities;

public class World : BaseEntity
{
    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public WorldStatus Status { get; private set; } =
        WorldStatus.Active;

    public ICollection<Folder> Folders { get; set; } =
        new List<Folder>();

    public ICollection<Page> Pages { get; set; } =
        new List<Page>();

    public ICollection<FileAttachment> Files { get; set; } =
        new List<FileAttachment>();

    public ICollection<MapMarker> MapMarkers { get; set; } =
        new List<MapMarker>();

    public ICollection<WorldMap> Maps { get; set; } =
        new List<WorldMap>();

    public ICollection<MarkerCategory> MarkerCategories { get; set; } =
        new List<MarkerCategory>();

    public ICollection<MapImageLayer> MapImageLayers { get; set; } =
        new List<MapImageLayer>();

    public ICollection<MapDrawingStroke> MapDrawingStrokes { get; set; } =
        new List<MapDrawingStroke>();

    public void Archive()
    {
        if (Status == WorldStatus.Archived)
        {
            return;
        }

        Status = WorldStatus.Archived;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Restore()
    {
        if (Status == WorldStatus.Active)
        {
            return;
        }

        Status = WorldStatus.Active;
        UpdatedAt = DateTime.UtcNow;
    }
}
