using EraSwiataLegend.Domain.Common;

namespace EraSwiataLegend.Domain.Entities;

public class Folder : BaseEntity
{
    public Guid WorldId { get; set; }

    public Guid? ParentFolderId { get; set; }

    public string Name { get; set; } = string.Empty;

    public World World { get; set; } = null!;

    public Folder? ParentFolder { get; set; }

    public ICollection<Folder> ChildFolders { get; set; } =
        new List<Folder>();

    public ICollection<Page> Pages { get; set; } =
        new List<Page>();
}