using EraSwiataLegend.Domain.Common;
using EraSwiataLegend.Domain.Enums;

namespace EraSwiataLegend.Domain.Entities;

public class Folder : BaseEntity
{
    public Guid WorldId { get; set; }

    public Guid? ParentFolderId { get; set; }

    public string Name { get; set; } = string.Empty;

    public FolderType Type { get; set; } = FolderType.Normal;

    public World World { get; set; } = null!;

    public Folder? ParentFolder { get; set; }

    public ICollection<Folder> ChildFolders { get; set; } =
        new List<Folder>();

    public ICollection<Page> Pages { get; set; } =
        new List<Page>();

    public void Rename(string name)
    {
        if (Type is FolderType.Archive or FolderType.Trash)
        {
            throw new InvalidOperationException(
                "Nie można zmienić nazwy folderu systemowego.");
        }

        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException(
                "Nazwa folderu jest wymagana.",
                nameof(name));
        }

        Name = name.Trim();
        UpdatedAt = DateTime.UtcNow;
    }
}