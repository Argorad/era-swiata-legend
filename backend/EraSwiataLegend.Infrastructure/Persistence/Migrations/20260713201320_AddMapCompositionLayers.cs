using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EraSwiataLegend.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMapCompositionLayers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "GridSize",
                table: "WorldMaps",
                type: "integer",
                nullable: false,
                defaultValue: 64);

            migrationBuilder.AddColumn<bool>(
                name: "IsGridVisible",
                table: "WorldMaps",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsPositionLocked",
                table: "MapMarkers",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "MapDrawingStrokes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    WorldId = table.Column<Guid>(type: "uuid", nullable: false),
                    MapId = table.Column<Guid>(type: "uuid", nullable: false),
                    Color = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Width = table.Column<double>(type: "double precision", nullable: false),
                    IsEraser = table.Column<bool>(type: "boolean", nullable: false),
                    PointsJson = table.Column<string>(type: "text", nullable: false),
                    IsVisibleToPlayers = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MapDrawingStrokes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MapDrawingStrokes_WorldMaps_MapId",
                        column: x => x.MapId,
                        principalTable: "WorldMaps",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MapDrawingStrokes_Worlds_WorldId",
                        column: x => x.WorldId,
                        principalTable: "Worlds",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MapImageLayers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    WorldId = table.Column<Guid>(type: "uuid", nullable: false),
                    MapId = table.Column<Guid>(type: "uuid", nullable: false),
                    FileAttachmentId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    PositionX = table.Column<double>(type: "double precision", nullable: false),
                    PositionY = table.Column<double>(type: "double precision", nullable: false),
                    Scale = table.Column<double>(type: "double precision", nullable: false),
                    Rotation = table.Column<double>(type: "double precision", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    IsVisible = table.Column<bool>(type: "boolean", nullable: false),
                    IsVisibleToPlayers = table.Column<bool>(type: "boolean", nullable: false),
                    IsLocked = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MapImageLayers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MapImageLayers_FileAttachments_FileAttachmentId",
                        column: x => x.FileAttachmentId,
                        principalTable: "FileAttachments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MapImageLayers_WorldMaps_MapId",
                        column: x => x.MapId,
                        principalTable: "WorldMaps",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MapImageLayers_Worlds_WorldId",
                        column: x => x.WorldId,
                        principalTable: "Worlds",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MapDrawingStrokes_MapId_CreatedAt",
                table: "MapDrawingStrokes",
                columns: new[] { "MapId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_MapDrawingStrokes_WorldId",
                table: "MapDrawingStrokes",
                column: "WorldId");

            migrationBuilder.CreateIndex(
                name: "IX_MapImageLayers_FileAttachmentId",
                table: "MapImageLayers",
                column: "FileAttachmentId");

            migrationBuilder.CreateIndex(
                name: "IX_MapImageLayers_MapId_SortOrder",
                table: "MapImageLayers",
                columns: new[] { "MapId", "SortOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_MapImageLayers_WorldId",
                table: "MapImageLayers",
                column: "WorldId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MapDrawingStrokes");

            migrationBuilder.DropTable(
                name: "MapImageLayers");

            migrationBuilder.DropColumn(
                name: "GridSize",
                table: "WorldMaps");

            migrationBuilder.DropColumn(
                name: "IsGridVisible",
                table: "WorldMaps");

            migrationBuilder.DropColumn(
                name: "IsPositionLocked",
                table: "MapMarkers");
        }
    }
}
