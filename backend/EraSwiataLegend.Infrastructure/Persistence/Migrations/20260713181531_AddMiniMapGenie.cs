using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EraSwiataLegend.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMiniMapGenie : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "CategoryId",
                table: "MapMarkers",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Color",
                table: "MapMarkers",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Icon",
                table: "MapMarkers",
                type: "character varying(40)",
                maxLength: 40,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "IsPublished",
                table: "MapMarkers",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "MapId",
                table: "MapMarkers",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PreviousStatus",
                table: "MapMarkers",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "MapMarkers",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Guid>(
                name: "TargetMapId",
                table: "MapMarkers",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "MarkerCategories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    WorldId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Icon = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Color = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MarkerCategories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MarkerCategories_Worlds_WorldId",
                        column: x => x.WorldId,
                        principalTable: "Worlds",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WorldMaps",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    WorldId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    ImageFileId = table.Column<Guid>(type: "uuid", nullable: false),
                    IsPublished = table.Column<bool>(type: "boolean", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorldMaps", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WorldMaps_FileAttachments_ImageFileId",
                        column: x => x.ImageFileId,
                        principalTable: "FileAttachments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WorldMaps_Worlds_WorldId",
                        column: x => x.WorldId,
                        principalTable: "Worlds",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MapMarkers_CategoryId",
                table: "MapMarkers",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_MapMarkers_MapId",
                table: "MapMarkers",
                column: "MapId");

            migrationBuilder.CreateIndex(
                name: "IX_MapMarkers_TargetMapId",
                table: "MapMarkers",
                column: "TargetMapId");

            migrationBuilder.CreateIndex(
                name: "IX_MarkerCategories_WorldId_Name",
                table: "MarkerCategories",
                columns: new[] { "WorldId", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_WorldMaps_ImageFileId",
                table: "WorldMaps",
                column: "ImageFileId");

            migrationBuilder.CreateIndex(
                name: "IX_WorldMaps_WorldId",
                table: "WorldMaps",
                column: "WorldId");

            migrationBuilder.AddForeignKey(
                name: "FK_MapMarkers_MarkerCategories_CategoryId",
                table: "MapMarkers",
                column: "CategoryId",
                principalTable: "MarkerCategories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_MapMarkers_WorldMaps_MapId",
                table: "MapMarkers",
                column: "MapId",
                principalTable: "WorldMaps",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_MapMarkers_WorldMaps_TargetMapId",
                table: "MapMarkers",
                column: "TargetMapId",
                principalTable: "WorldMaps",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MapMarkers_MarkerCategories_CategoryId",
                table: "MapMarkers");

            migrationBuilder.DropForeignKey(
                name: "FK_MapMarkers_WorldMaps_MapId",
                table: "MapMarkers");

            migrationBuilder.DropForeignKey(
                name: "FK_MapMarkers_WorldMaps_TargetMapId",
                table: "MapMarkers");

            migrationBuilder.DropTable(
                name: "MarkerCategories");

            migrationBuilder.DropTable(
                name: "WorldMaps");

            migrationBuilder.DropIndex(
                name: "IX_MapMarkers_CategoryId",
                table: "MapMarkers");

            migrationBuilder.DropIndex(
                name: "IX_MapMarkers_MapId",
                table: "MapMarkers");

            migrationBuilder.DropIndex(
                name: "IX_MapMarkers_TargetMapId",
                table: "MapMarkers");

            migrationBuilder.DropColumn(
                name: "CategoryId",
                table: "MapMarkers");

            migrationBuilder.DropColumn(
                name: "Color",
                table: "MapMarkers");

            migrationBuilder.DropColumn(
                name: "Icon",
                table: "MapMarkers");

            migrationBuilder.DropColumn(
                name: "IsPublished",
                table: "MapMarkers");

            migrationBuilder.DropColumn(
                name: "MapId",
                table: "MapMarkers");

            migrationBuilder.DropColumn(
                name: "PreviousStatus",
                table: "MapMarkers");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "MapMarkers");

            migrationBuilder.DropColumn(
                name: "TargetMapId",
                table: "MapMarkers");
        }
    }
}
