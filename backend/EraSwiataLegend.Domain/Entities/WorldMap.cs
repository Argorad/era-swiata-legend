using EraSwiataLegend.Domain.Common;
using EraSwiataLegend.Domain.Enums;

namespace EraSwiataLegend.Domain.Entities;

public class WorldMap : BaseEntity
{
    public Guid WorldId { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public WorldMapType Type { get; set; }

    public Guid ImageFileId { get; set; }

    public bool IsPublished { get; set; }

    // Legacy persistence only. The grid feature is no longer exposed or used.
    public bool IsGridVisible { get; set; }

    public int GridSize { get; set; } = 64;

    public string CanvasBackground { get; set; } = "ocean";

    public string GridStyle { get; set; } = "lines";

    public string GridColor { get; set; } = "#9ed8e5";

    public double GridOpacity { get; set; } = 0.55;

    public double GridLineWidth { get; set; } = 1.5;

    public int GridMajorEvery { get; set; } = 5;

    public bool IsGridMajorVisible { get; set; } = true;

    public bool IsSnapToGridEnabled { get; set; }

    public bool IsDrawingLayerVisible { get; set; } = true;

    public bool IsDrawingLayerLocked { get; set; }

    public bool IsDrawingLayerVisibleToPlayers { get; set; }

    public WorldMapStatus Status { get; private set; } =
        WorldMapStatus.Active;

    public World World { get; set; } = null!;

    public FileAttachment ImageFile { get; set; } = null!;

    public ICollection<MapMarker> Markers { get; set; } =
        new List<MapMarker>();

    public ICollection<MapImageLayer> ImageLayers { get; set; } =
        new List<MapImageLayer>();

    public ICollection<MapDrawingStroke> DrawingStrokes { get; set; } =
        new List<MapDrawingStroke>();

    public void ConfigureDrawingLayer(
        bool isVisible, bool isLocked, bool isVisibleToPlayers)
    {
        IsDrawingLayerVisible = isVisible;
        IsDrawingLayerLocked = isLocked;
        IsDrawingLayerVisibleToPlayers = isVisibleToPlayers;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Update(
        string name,
        string description,
        WorldMapType type,
        Guid imageFileId,
        bool isPublished)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException(
                "Nazwa mapy jest wymagana.",
                nameof(name));
        }

        Name = name.Trim();
        Description = description.Trim();
        Type = type;
        ImageFileId = imageFileId;
        IsPublished = isPublished;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Archive()
    {
        Status = WorldMapStatus.Archived;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Restore()
    {
        Status = WorldMapStatus.Active;
        UpdatedAt = DateTime.UtcNow;
    }
}
