using EraSwiataLegend.Domain.Common;

namespace EraSwiataLegend.Domain.Entities;

public class World : BaseEntity
{
    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public ICollection<Folder> Folders { get; set; } =
        new List<Folder>();

    public ICollection<Page> Pages { get; set; } =
        new List<Page>();
}