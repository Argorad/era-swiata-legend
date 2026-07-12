using EraSwiataLegend.Domain.Common;

namespace EraSwiataLegend.Domain.Entities;

public class Page : BaseEntity
{
    public Guid WorldId { get; set; }

    public Guid FolderId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Content { get; set; } = string.Empty;

    public World World { get; set; } = null!;

    public Folder Folder { get; set; } = null!;
}