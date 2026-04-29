using backend.infrastructure;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

public static class TestDbHelper
{
    // Creates an in-memory SQLite DBContext.
    // The caller is responsible for disposing both the context and the connection.
    public static (DBContext db, SqliteConnection connection) Create()
    {
        var connection = new SqliteConnection("DataSource=:memory:");
        connection.Open();

        var options = new DbContextOptionsBuilder<DBContext>()
            .UseSqlite(connection)
            .Options;

        var db = new DBContext(options);
        db.Database.EnsureCreated();

        return (db, connection);
    }
}
