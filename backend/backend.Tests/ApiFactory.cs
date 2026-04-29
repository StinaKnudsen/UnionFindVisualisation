using backend.infrastructure;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

// Creates a test version of the web app using an in-memory SQLite database.
// Shared across all tests in a class via IClassFixture<ApiFactory>.
public class ApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly SqliteConnection _connection = new("DataSource=:memory:");

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // Tell the app it is running in test mode — skips EnsureDeleted/Migrate in Program.cs
        builder.UseEnvironment("Testing");

        builder.ConfigureServices(services =>
        {
            // Remove the real DBContext options registered by Program.cs
            var descriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<DBContext>));
            if (descriptor != null)
                services.Remove(descriptor);

            // Register a DBContext that uses our shared in-memory connection
            services.AddDbContext<DBContext>(options =>
                options.UseSqlite(_connection));
        });
    }

    // Called once before any test in the class runs — opens connection and creates schema
    public async Task InitializeAsync()
    {
        await _connection.OpenAsync();

        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<DBContext>();
        await db.Database.EnsureCreatedAsync();
    }

    // Called once after all tests in the class finish
    public new async Task DisposeAsync()
    {
        await _connection.DisposeAsync();
        await base.DisposeAsync();
    }
}
