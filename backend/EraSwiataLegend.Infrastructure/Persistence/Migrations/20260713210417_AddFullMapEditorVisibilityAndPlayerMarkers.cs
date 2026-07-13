using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EraSwiataLegend.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddFullMapEditorVisibilityAndPlayerMarkers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CanvasBackground",
                table: "WorldMaps",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "ocean");

            migrationBuilder.AddColumn<string>(
                name: "GridColor",
                table: "WorldMaps",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "#9ed8e5");

            migrationBuilder.AddColumn<double>(
                name: "GridLineWidth",
                table: "WorldMaps",
                type: "double precision",
                nullable: false,
                defaultValue: 1.5);

            migrationBuilder.AddColumn<int>(
                name: "GridMajorEvery",
                table: "WorldMaps",
                type: "integer",
                nullable: false,
                defaultValue: 5);

            migrationBuilder.AddColumn<double>(
                name: "GridOpacity",
                table: "WorldMaps",
                type: "double precision",
                nullable: false,
                defaultValue: 0.55000000000000004);

            migrationBuilder.AddColumn<string>(
                name: "GridStyle",
                table: "WorldMaps",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "lines");

            migrationBuilder.AddColumn<bool>(
                name: "IsDrawingLayerLocked",
                table: "WorldMaps",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsDrawingLayerVisible",
                table: "WorldMaps",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDrawingLayerVisibleToPlayers",
                table: "WorldMaps",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsGridMajorVisible",
                table: "WorldMaps",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsSnapToGridEnabled",
                table: "WorldMaps",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "AuthorDisplayName",
                table: "MapMarkers",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsHiddenByGameMaster",
                table: "MapMarkers",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsPlayerMarker",
                table: "MapMarkers",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "OwnerUserId",
                table: "MapMarkers",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PlayerVisibility",
                table: "MapMarkers",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<double>(
                name: "Opacity",
                table: "MapImageLayers",
                type: "double precision",
                nullable: false,
                defaultValue: 1.0);

            migrationBuilder.AddColumn<string>(
                name: "DashStyle",
                table: "MapDrawingStrokes",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "solid");

            migrationBuilder.AddColumn<string>(
                name: "FillColor",
                table: "MapDrawingStrokes",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "transparent");

            migrationBuilder.AddColumn<double>(
                name: "FontSize",
                table: "MapDrawingStrokes",
                type: "double precision",
                nullable: false,
                defaultValue: 24.0);

            migrationBuilder.AddColumn<bool>(
                name: "IsLocked",
                table: "MapDrawingStrokes",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsVisible",
                table: "MapDrawingStrokes",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<double>(
                name: "Opacity",
                table: "MapDrawingStrokes",
                type: "double precision",
                nullable: false,
                defaultValue: 1.0);

            migrationBuilder.AddColumn<double>(
                name: "Rotation",
                table: "MapDrawingStrokes",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<int>(
                name: "SortOrder",
                table: "MapDrawingStrokes",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Text",
                table: "MapDrawingStrokes",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Tool",
                table: "MapDrawingStrokes",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "pen");

            migrationBuilder.AddColumn<bool>(
                name: "IsVisibleToPlayers",
                table: "Folders",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsVisibleToPlayers",
                table: "FileAttachments",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_MapMarkers_OwnerUserId",
                table: "MapMarkers",
                column: "OwnerUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_MapMarkers_UserAccounts_OwnerUserId",
                table: "MapMarkers",
                column: "OwnerUserId",
                principalTable: "UserAccounts",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MapMarkers_UserAccounts_OwnerUserId",
                table: "MapMarkers");

            migrationBuilder.DropIndex(
                name: "IX_MapMarkers_OwnerUserId",
                table: "MapMarkers");

            migrationBuilder.DropColumn(
                name: "CanvasBackground",
                table: "WorldMaps");

            migrationBuilder.DropColumn(
                name: "GridColor",
                table: "WorldMaps");

            migrationBuilder.DropColumn(
                name: "GridLineWidth",
                table: "WorldMaps");

            migrationBuilder.DropColumn(
                name: "GridMajorEvery",
                table: "WorldMaps");

            migrationBuilder.DropColumn(
                name: "GridOpacity",
                table: "WorldMaps");

            migrationBuilder.DropColumn(
                name: "GridStyle",
                table: "WorldMaps");

            migrationBuilder.DropColumn(
                name: "IsDrawingLayerLocked",
                table: "WorldMaps");

            migrationBuilder.DropColumn(
                name: "IsDrawingLayerVisible",
                table: "WorldMaps");

            migrationBuilder.DropColumn(
                name: "IsDrawingLayerVisibleToPlayers",
                table: "WorldMaps");

            migrationBuilder.DropColumn(
                name: "IsGridMajorVisible",
                table: "WorldMaps");

            migrationBuilder.DropColumn(
                name: "IsSnapToGridEnabled",
                table: "WorldMaps");

            migrationBuilder.DropColumn(
                name: "AuthorDisplayName",
                table: "MapMarkers");

            migrationBuilder.DropColumn(
                name: "IsHiddenByGameMaster",
                table: "MapMarkers");

            migrationBuilder.DropColumn(
                name: "IsPlayerMarker",
                table: "MapMarkers");

            migrationBuilder.DropColumn(
                name: "OwnerUserId",
                table: "MapMarkers");

            migrationBuilder.DropColumn(
                name: "PlayerVisibility",
                table: "MapMarkers");

            migrationBuilder.DropColumn(
                name: "Opacity",
                table: "MapImageLayers");

            migrationBuilder.DropColumn(
                name: "DashStyle",
                table: "MapDrawingStrokes");

            migrationBuilder.DropColumn(
                name: "FillColor",
                table: "MapDrawingStrokes");

            migrationBuilder.DropColumn(
                name: "FontSize",
                table: "MapDrawingStrokes");

            migrationBuilder.DropColumn(
                name: "IsLocked",
                table: "MapDrawingStrokes");

            migrationBuilder.DropColumn(
                name: "IsVisible",
                table: "MapDrawingStrokes");

            migrationBuilder.DropColumn(
                name: "Opacity",
                table: "MapDrawingStrokes");

            migrationBuilder.DropColumn(
                name: "Rotation",
                table: "MapDrawingStrokes");

            migrationBuilder.DropColumn(
                name: "SortOrder",
                table: "MapDrawingStrokes");

            migrationBuilder.DropColumn(
                name: "Text",
                table: "MapDrawingStrokes");

            migrationBuilder.DropColumn(
                name: "Tool",
                table: "MapDrawingStrokes");

            migrationBuilder.DropColumn(
                name: "IsVisibleToPlayers",
                table: "Folders");

            migrationBuilder.DropColumn(
                name: "IsVisibleToPlayers",
                table: "FileAttachments");
        }
    }
}
