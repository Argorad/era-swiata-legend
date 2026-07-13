namespace EraSwiataLegend.Domain.Rules;

public static class FolderHierarchyRules
{
    public static bool WouldCreateCycle(
        Guid folderId,
        Guid? destinationFolderId,
        IReadOnlyDictionary<Guid, Guid?> parentByFolderId)
    {
        var currentId = destinationFolderId;
        var visited = new HashSet<Guid>();

        while (currentId.HasValue && visited.Add(currentId.Value))
        {
            if (currentId.Value == folderId)
            {
                return true;
            }

            currentId = parentByFolderId.TryGetValue(
                currentId.Value,
                out var parentId)
                ? parentId
                : null;
        }

        return false;
    }
}
