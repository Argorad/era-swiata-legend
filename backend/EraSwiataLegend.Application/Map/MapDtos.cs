using EraSwiataLegend.Domain.Enums;

namespace EraSwiataLegend.Application.Map;

public sealed record WorldMapDto(
    Guid Id,
    Guid WorldId,
    string Name,
    string Description,
    WorldMapType Type,
    Guid ImageFileId,
    bool IsPublished,
    bool IsDrawingLayerVisible,
    bool IsDrawingLayerLocked,
    bool IsDrawingLayerVisibleToPlayers,
    WorldMapStatus Status,
    DateTime CreatedAt,
    DateTime? UpdatedAt);

public sealed record SaveWorldMapRequest(
    string Name,
    string? Description,
    WorldMapType Type,
    Guid ImageFileId,
    bool IsPublished);

public sealed record WorldMapOperationResult(
    WorldMapDto? Map,
    string? Error);

public sealed record MarkerCategoryDto(
    Guid Id,
    Guid WorldId,
    string Name,
    string Icon,
    string Color,
    int SortOrder,
    bool IsActive,
    DateTime CreatedAt,
    DateTime? UpdatedAt);

public sealed record SaveMarkerCategoryRequest(
    string Name,
    string Icon,
    string Color,
    int SortOrder,
    bool IsActive);

public sealed record MarkerCategoryOperationResult(
    MarkerCategoryDto? Category,
    string? Error);

public sealed record MapMarkerDto(
    Guid Id,
    Guid WorldId,
    Guid MapId,
    Guid CategoryId,
    string CategoryName,
    string Name,
    string Description,
    string Icon,
    string Color,
    double PositionX,
    double PositionY,
    bool IsPublished,
    bool IsPositionLocked,
    MapMarkerStatus Status,
    MapMarkerStatus? PreviousStatus,
    Guid? FolderId,
    Guid? PageId,
    Guid? TargetMapId,
    DateTime CreatedAt,
    DateTime? UpdatedAt);

public sealed record SaveMapMarkerRequest(
    Guid CategoryId,
    string Name,
    string? Description,
    string Icon,
    string Color,
    double PositionX,
    double PositionY,
    bool IsPublished,
    bool IsPositionLocked,
    Guid? FolderId,
    Guid? PageId,
    Guid? TargetMapId,
    Guid? Id = null);

public sealed record MoveMapMarkerRequest(
    double PositionX,
    double PositionY);

public sealed record SetMarkerLockRequest(bool IsLocked);

public sealed record MapMarkerOperationResult(
    MapMarkerDto? Marker,
    string? Error);

public sealed record MapImageLayerDto(
    Guid Id,
    Guid WorldId,
    Guid MapId,
    Guid FileAttachmentId,
    string FileName,
    string ContentType,
    string Name,
    double PositionX,
    double PositionY,
    double Scale,
    double Rotation,
    int SortOrder,
    bool IsVisible,
    bool IsVisibleToPlayers,
    bool IsLocked,
    double Opacity,
    DateTime CreatedAt,
    DateTime? UpdatedAt);

public sealed record SaveMapImageLayerRequest(
    Guid FileAttachmentId,
    string Name,
    double PositionX,
    double PositionY,
    double Scale,
    double Rotation,
    int SortOrder,
    bool IsVisible,
    bool IsVisibleToPlayers,
    bool IsLocked,
    double Opacity = 1,
    Guid? Id = null);

public sealed record MapImageLayerOperationResult(
    MapImageLayerDto? Layer,
    string? Error);

public sealed record MapStrokePointDto(double X, double Y);

public sealed record MapDrawingStrokeDto(
    Guid Id,
    Guid WorldId,
    Guid MapId,
    string Color,
    double Width,
    bool IsEraser,
    IReadOnlyList<MapStrokePointDto> Points,
    bool IsVisibleToPlayers,
    DateTime CreatedAt,
    string Tool,
    string FillColor,
    double Opacity,
    string DashStyle,
    string Text,
    double FontSize,
    bool HasTextBorder,
    double Rotation,
    int SortOrder,
    bool IsVisible,
    bool IsLocked);

public sealed record SaveMapDrawingStrokeRequest(
    string Color,
    double Width,
    bool IsEraser,
    IReadOnlyList<MapStrokePointDto> Points,
    bool IsVisibleToPlayers,
    string Tool = "pen",
    string FillColor = "transparent",
    double Opacity = 1,
    string DashStyle = "solid",
    string Text = "",
    double FontSize = 24,
    bool HasTextBorder = true,
    double Rotation = 0,
    int SortOrder = 0,
    bool IsVisible = true,
    bool IsLocked = false,
    Guid? Id = null);

public sealed record ConfigureDrawingLayerRequest(
    bool IsVisible,
    bool IsLocked,
    bool IsVisibleToPlayers);
