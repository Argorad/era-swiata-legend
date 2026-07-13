using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EraSwiataLegend.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddWorldStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "Worlds",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Status",
                table: "Worlds");
        }
    }
}
