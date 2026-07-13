using EraSwiataLegend.Domain.Common;

namespace EraSwiataLegend.Domain.Entities;

public class MapImageLayer : BaseEntity
{
    public Guid WorldId { get; set; }
    public Guid MapId { get; set; }
    public Guid FileAttachmentId { get; set; }
    public string Name { get; set; } = string.Empty;
    public double PositionX { get; set; }
    public double PositionY { get; set; }
    public double Scale { get; set; } = 1;
    public double Rotation { get; set; }
    public int SortOrder { get; set; }
    public bool IsVisible { get; set; } = true;
    public bool IsVisibleToPlayers { get; set; } = true;
    public bool IsLocked { get; set; }
    public double Opacity { get; set; } = 1;
    public World World { get; set; } = null!;
    public WorldMap Map { get; set; } = null!;
    public FileAttachment FileAttachment { get; set; } = null!;

    public void Update(
        string name,
        double positionX,
        double positionY,
        double scale,
        double rotation,
        int sortOrder,
        bool isVisible,
        bool isVisibleToPlayers,
        bool isLocked,
        double opacity)
    {
        if (string.IsNullOrWhiteSpace(name) || scale is < 0.05 or > 20 ||
            rotation is < -3600 or > 3600 || sortOrder is < 0 or > 100000 ||
            opacity is < 0 or > 1)
        {
            throw new ArgumentException("Nieprawidłowe parametry warstwy mapy.");
        }

        Name = name.Trim();
        PositionX = positionX;
        PositionY = positionY;
        Scale = scale;
        Rotation = rotation;
        SortOrder = sortOrder;
        IsVisible = isVisible;
        IsVisibleToPlayers = isVisibleToPlayers;
        IsLocked = isLocked;
        Opacity = opacity;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Update(
        string name, double positionX, double positionY, double scale,
        double rotation, int sortOrder, bool isVisible,
        bool isVisibleToPlayers, bool isLocked) =>
        Update(name, positionX, positionY, scale, rotation, sortOrder,
            isVisible, isVisibleToPlayers, isLocked, Opacity);
}
