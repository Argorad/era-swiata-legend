using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EraSwiataLegend.Infrastructure.Persistence.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20260714000000_AddLocalUserAuthentication")]
partial class AddLocalUserAuthentication
{
    protected override void BuildTargetModel(ModelBuilder modelBuilder)
    {
        ApplicationDbContextModelSnapshot.BuildSnapshot(modelBuilder);
    }
}
