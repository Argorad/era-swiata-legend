using EraSwiataLegend.Domain.Common;

namespace EraSwiataLegend.Domain.Entities;

public class Page : BaseEntity
{
    public Guid WorldId { get; set; }

    public Guid FolderId { get; set; }

    public Guid? PreviousFolderId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Content { get; set; } = string.Empty;

    public World World { get; set; } = null!;

    public Folder Folder { get; set; } = null!;

    public void Edit(string title, string content)
    {
        if (string.IsNullOrWhiteSpace(title))
        {
            throw new ArgumentException(
                "Tytuł strony jest wymagany.",
                nameof(title));
        }

        Title = title.Trim();
        Content = content.Trim();
        UpdatedAt = DateTime.UtcNow;
    }

    public void MoveTo(Guid folderId, bool rememberCurrentFolder)
    {
        if (rememberCurrentFolder)
        {
            PreviousFolderId = FolderId;
        }

        FolderId = folderId;
        UpdatedAt = DateTime.UtcNow;
    }

    public void RestoreTo(Guid folderId)
    {
        FolderId = folderId;
        PreviousFolderId = null;
        UpdatedAt = DateTime.UtcNow;
    }
}
