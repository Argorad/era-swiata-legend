using EraSwiataLegend.Domain.Common;

namespace EraSwiataLegend.Domain.Entities;

public class FileAttachment : BaseEntity
{
    public Guid WorldId { get; set; }

    public Guid FolderId { get; set; }

    public Guid? PreviousFolderId { get; set; }

    public string OriginalName { get; set; } = string.Empty;

    public string StoredName { get; set; } = string.Empty;

    public long Size { get; set; }

    public string ContentType { get; set; } =
        "application/octet-stream";

    public bool IsVisibleToPlayers { get; set; }

    public World World { get; set; } = null!;

    public Folder Folder { get; set; } = null!;

    public void MoveToTrash(Guid trashFolderId)
    {
        PreviousFolderId = FolderId;
        FolderId = trashFolderId;
        UpdatedAt = DateTime.UtcNow;
    }

    public void RestoreTo(Guid folderId)
    {
        FolderId = folderId;
        PreviousFolderId = null;
        UpdatedAt = DateTime.UtcNow;
    }
}
