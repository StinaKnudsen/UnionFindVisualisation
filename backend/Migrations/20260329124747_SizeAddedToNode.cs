using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class SizeAddedToNode : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Nodes_Trees_TreeId",
                table: "Nodes");

            migrationBuilder.DropTable(
                name: "Trees");

            migrationBuilder.DropIndex(
                name: "IX_Nodes_TreeId",
                table: "Nodes");

            migrationBuilder.DropColumn(
                name: "TreeId",
                table: "Nodes");

            migrationBuilder.AddColumn<int>(
                name: "Size",
                table: "Nodes",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Size",
                table: "Nodes");

            migrationBuilder.AddColumn<int>(
                name: "TreeId",
                table: "Nodes",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Trees",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    size = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Trees", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Nodes_TreeId",
                table: "Nodes",
                column: "TreeId");

            migrationBuilder.AddForeignKey(
                name: "FK_Nodes_Trees_TreeId",
                table: "Nodes",
                column: "TreeId",
                principalTable: "Trees",
                principalColumn: "Id");
        }
    }
}
