using EraSwiataLegend.Domain.Enums;

namespace EraSwiataLegend.Domain.Rules;

public static class KnowledgeLifecycleRules
{
    public static bool CanPermanentlyDeletePage(
        FolderType currentFolderType) =>
        currentFolderType == FolderType.Trash;

    public static bool CanPermanentlyDeleteMarker(
        MapMarkerStatus status) =>
        status == MapMarkerStatus.Trash;
}
