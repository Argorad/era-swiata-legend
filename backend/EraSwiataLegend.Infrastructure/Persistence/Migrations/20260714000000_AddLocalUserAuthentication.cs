using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EraSwiataLegend.Infrastructure.Persistence.Migrations;

public partial class AddLocalUserAuthentication : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "Email",
            table: "UserAccounts",
            type: "character varying(320)",
            maxLength: 320,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "NormalizedEmail",
            table: "UserAccounts",
            type: "character varying(320)",
            maxLength: 320,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "NormalizedDisplayName",
            table: "UserAccounts",
            type: "character varying(200)",
            maxLength: 200,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "PasswordHash",
            table: "UserAccounts",
            type: "character varying(1000)",
            maxLength: 1000,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "SecurityStamp",
            table: "UserAccounts",
            type: "character varying(64)",
            maxLength: 64,
            nullable: true);

        migrationBuilder.Sql("""
            UPDATE "UserAccounts"
            SET "NormalizedDisplayName" = UPPER(BTRIM("DisplayName"))
            WHERE "NormalizedDisplayName" IS NULL
              AND "DisplayName" IS NOT NULL
              AND BTRIM("DisplayName") <> '';
            """);

        migrationBuilder.CreateIndex(
            name: "IX_UserAccounts_NormalizedDisplayName",
            table: "UserAccounts",
            column: "NormalizedDisplayName",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_UserAccounts_NormalizedEmail",
            table: "UserAccounts",
            column: "NormalizedEmail",
            unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_UserAccounts_NormalizedDisplayName",
            table: "UserAccounts");

        migrationBuilder.DropIndex(
            name: "IX_UserAccounts_NormalizedEmail",
            table: "UserAccounts");

        migrationBuilder.DropColumn(
            name: "Email",
            table: "UserAccounts");

        migrationBuilder.DropColumn(
            name: "NormalizedEmail",
            table: "UserAccounts");

        migrationBuilder.DropColumn(
            name: "NormalizedDisplayName",
            table: "UserAccounts");

        migrationBuilder.DropColumn(
            name: "PasswordHash",
            table: "UserAccounts");

        migrationBuilder.DropColumn(
            name: "SecurityStamp",
            table: "UserAccounts");
    }
}
