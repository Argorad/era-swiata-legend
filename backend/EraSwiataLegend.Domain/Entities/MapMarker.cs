using EraSwiataLegend.Domain.Common;
using EraSwiataLegend.Domain.Enums;

namespace EraSwiataLegend.Domain.Entities;

public class MapMarker : BaseEntity
{
    public Guid WorldId { get; set; }

    public Guid? MapId { get; set; }

    public Guid? CategoryId { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public MapMarkerType Type { get; set; } = MapMarkerType.Place;

    public double PositionX { get; set; }

    public double PositionY { get; set; }

    public Guid? FolderId { get; set; }

    public Guid? PageId { get; set; }

    public Guid? TargetMapId { get; set; }

    public string Icon { get; set; } = "◆";

    public string Color { get; set; } = "#b98a45";

    public bool IsPublished { get; set; }

    public bool IsPositionLocked { get; private set; }

    public Guid? OwnerUserId { get; set; }

    public string? AuthorDisplayName { get; set; }

    public bool IsPlayerMarker { get; set; }

    public int PlayerVisibility { get; set; }

    public bool IsHiddenByGameMaster { get; set; }

    public UserAccount? OwnerUser { get; set; }

    public MapMarkerStatus Status { get; private set; } =
        MapMarkerStatus.Active;

    public MapMarkerStatus? PreviousStatus { get; private set; }

    public World World { get; set; } = null!;

    public Folder? Folder { get; set; }

    public Page? Page { get; set; }

    public WorldMap? Map { get; set; }

    public WorldMap? TargetMap { get; set; }

    public MarkerCategory? Category { get; set; }

    public void Update(
        string name,
        string description,
        MapMarkerType type,
        double positionX,
        double positionY,
        Guid? folderId,
        Guid? pageId,
        Guid? targetMapId = null,
        Guid? categoryId = null,
        string icon = "◆",
        string color = "#b98a45",
        bool isPublished = false)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException(
                "Nazwa markera jest wymagana.",
                nameof(name));
        }

        if (positionX is < 0 or > 1 ||
            positionY is < 0 or > 1)
        {
            throw new ArgumentOutOfRangeException(
                nameof(positionX),
                "Pozycja markera musi mieścić się w zakresie 0–1.");
        }

        Name = name.Trim();
        Description = description.Trim();
        Type = type;
        PositionX = positionX;
        PositionY = positionY;
        FolderId = folderId;
        PageId = pageId;
        TargetMapId = targetMapId;
        CategoryId = categoryId;
        Icon = string.IsNullOrWhiteSpace(icon) ? "◆" : icon.Trim();
        Color = color.Trim();
        IsPublished = isPublished;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Move(double positionX, double positionY)
    {
        if (positionX is < 0 or > 1 ||
            positionY is < 0 or > 1)
        {
            throw new ArgumentOutOfRangeException(
                nameof(positionX));
        }

        PositionX = positionX;
        PositionY = positionY;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetPositionLocked(bool isLocked)
    {
        IsPositionLocked = isLocked;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetPublished(bool isPublished)
    {
        IsPublished = isPublished;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Archive()
    {
        Status = MapMarkerStatus.Archived;
        UpdatedAt = DateTime.UtcNow;
    }

    public void MoveToTrash()
    {
        PreviousStatus = Status;
        Status = MapMarkerStatus.Trash;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Restore()
    {
        Status = PreviousStatus is MapMarkerStatus.Active or
            MapMarkerStatus.Archived
            ? PreviousStatus.Value
            : MapMarkerStatus.Active;
        PreviousStatus = null;
        UpdatedAt = DateTime.UtcNow;
    }
}
