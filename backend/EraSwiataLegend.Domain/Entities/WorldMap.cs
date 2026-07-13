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

    public void ConfigureGrid(
        bool isVisible, int size, string style, string color,
        double opacity, double lineWidth, int majorEvery,
        bool isMajorVisible, bool isSnapEnabled, string canvasBackground)
    {
        if (size is < 8 or > 512)
        {
            throw new ArgumentOutOfRangeException(nameof(size));
        }

        if (style is not ("lines" or "dots" or "hex") ||
            canvasBackground is not ("ocean" or "parchment" or "dark" or "solid") ||
            !System.Text.RegularExpressions.Regex.IsMatch(color, "^#[0-9a-fA-F]{6}$") ||
            opacity is < 0.05 or > 1 || lineWidth is < 0.5 or > 8 || majorEvery is < 2 or > 20)
        {
            throw new ArgumentException("Nieprawidłowe ustawienia siatki.");
        }

        IsGridVisible = isVisible;
        GridSize = size;
        GridStyle = style;
        GridColor = color;
        GridOpacity = opacity;
        GridLineWidth = lineWidth;
        GridMajorEvery = majorEvery;
        IsGridMajorVisible = isMajorVisible;
        IsSnapToGridEnabled = isSnapEnabled;
        CanvasBackground = canvasBackground;
        UpdatedAt = DateTime.UtcNow;
    }

    public void ConfigureGrid(bool isVisible, int size) =>
        ConfigureGrid(isVisible, size, GridStyle, GridColor, GridOpacity,
            GridLineWidth, GridMajorEvery, IsGridMajorVisible,
            IsSnapToGridEnabled, CanvasBackground);

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
