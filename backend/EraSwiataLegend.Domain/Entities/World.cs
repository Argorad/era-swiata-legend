using EraSwiataLegend.Domain.Common;
using EraSwiataLegend.Domain.Enums;

namespace EraSwiataLegend.Domain.Entities;

public class World : BaseEntity
{
    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public WorldStatus Status { get; private set; } =
        WorldStatus.Active;

    public ICollection<Folder> Folders { get; set; } =
        new List<Folder>();

    public ICollection<Page> Pages { get; set; } =
        new List<Page>();

    public void Archive()
    {
        if (Status == WorldStatus.Archived)
        {
            return;
        }

        Status = WorldStatus.Archived;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Restore()
    {
        if (Status == WorldStatus.Active)
        {
            return;
        }

        Status = WorldStatus.Active;
        UpdatedAt = DateTime.UtcNow;
    }
}