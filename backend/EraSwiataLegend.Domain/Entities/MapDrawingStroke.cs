using EraSwiataLegend.Domain.Common;

namespace EraSwiataLegend.Domain.Entities;

public class MapDrawingStroke : BaseEntity
{
    public Guid WorldId { get; set; }
    public Guid MapId { get; set; }
    public string Color { get; set; } = "#9d2f32";
    public double Width { get; set; } = 4;
    public bool IsEraser { get; set; }
    public string PointsJson { get; set; } = "[]";
    public bool IsVisibleToPlayers { get; set; } = true;
    public string Tool { get; set; } = "pen";
    public string FillColor { get; set; } = "transparent";
    public double Opacity { get; set; } = 1;
    public string DashStyle { get; set; } = "solid";
    public string Text { get; set; } = string.Empty;
    public double FontSize { get; set; } = 24;
    public bool HasTextBorder { get; set; } = true;
    public double Rotation { get; set; }
    public int SortOrder { get; set; }
    public bool IsVisible { get; set; } = true;
    public bool IsLocked { get; set; }
    public World World { get; set; } = null!;
    public WorldMap Map { get; set; } = null!;
}
