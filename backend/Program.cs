using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore;
using backend.infrastructure;
using Core.Interfaces;
using backend.infrastructure.Repositories;
using backend.infrastructure.Services;
using backend.infrastructure.DTOs;
using Microsoft.VisualBasic;
using backend.infrastructure.Entities;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

string? connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<DBContext>(options =>
    options.UseSqlite(connectionString, b => b.MigrationsAssembly("backend")));

builder.Services.AddScoped<INodeEdgeRepository, NodeEdgeRepository>();
builder.Services.AddScoped<NodeEdgeService>();
builder.Services.AddScoped<UnionFindService>();
builder.Services.AddScoped<WeightedUFService>();
builder.Services.AddScoped<PathCompressionUFService>();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<DBContext>();
    db.Database.EnsureDeleted();       // Drop the database
    db.Database.Migrate();             // Recreate using migrations
}

app.UseCors("AllowFrontend");

// Helper function to determine which union-find service based on URL parameter
// UPDATE THE STRINGS WHEN FRONTEND HAS ENDPOINTS
IUnionFindService DetermineUF(string ufType, IServiceProvider sp) => ufType.ToUpper() switch
{
    "UF"    => sp.GetRequiredService<UnionFindService>(),
    "WUF"   => sp.GetRequiredService<WeightedUFService>(),
    // add path compression here
    "PCUF" => sp.GetRequiredService<PathCompressionUFService>(),
    _       => throw new ArgumentException($"Unknown algorithm: {ufType}")
};

app.MapGet("/api/edges/{id:int}", async (int id, NodeEdgeService NEService) =>
{
    var edge = await NEService.GetEdgeAsync(id);
    return edge is null ? Results.NotFound() : Results.Ok(edge);
});

app.MapPost("/api/{ufType}/edges", async (string ufType, EdgeDTO edge, DBContext dbContext, IServiceProvider sp) =>
{
    var uf = DetermineUF(ufType, sp);

    var startNode = await dbContext.Nodes.FindAsync(edge.StartNodeId);
    if (startNode == null)
    {
        startNode = new Node { Id = edge.StartNodeId, Parent = edge.StartNodeId };
        dbContext.Nodes.Add(startNode);
        await dbContext.SaveChangesAsync();
    }

    var endNode = await dbContext.Nodes.FindAsync(edge.EndNodeId);
    if (endNode == null)
    {
        endNode = new Node { Id = edge.EndNodeId, Parent = edge.EndNodeId };
        dbContext.Nodes.Add(endNode);
        await dbContext.SaveChangesAsync();
    }

    await uf.UnionAsync(edge.StartNodeId, edge.EndNodeId);

    var newEdge = new Edge { StartNodeId = edge.StartNodeId, EndNodeId = edge.EndNodeId };
    dbContext.Edges.Add(newEdge);
    await dbContext.SaveChangesAsync();

    // Return all nodes and edgeId so frontend can reconstruct trees
    var nodes = await dbContext.Nodes.ToListAsync();
    return Results.Ok(new {
        edgeId = newEdge.Id,
        nodes = nodes.Select(n => new NodeDTO { Id = n.Id, Parent = n.Parent })
    });
} 
);

app.MapDelete("/api/{ufType}/edges/{id:int}", async (string ufType, int id, NodeEdgeService NEService, IServiceProvider sp, DBContext dbContext) =>
{
    var uf = DetermineUF(ufType, sp);
    await NEService.DeleteEdgeOnClick(id);
    await uf.RebuildAsync();

    var nodes = await dbContext.Nodes.ToListAsync();
    return Results.Ok(nodes.Select(n => new NodeDTO { Id = n.Id, Parent = n.Parent }));
});

// get all nodes
app.MapGet("/api/{ufType}/nodes", async (string ufType, DBContext dbContext) =>
{
    var nodes = await dbContext.Nodes.ToListAsync();
    return Results.Ok(nodes.Select(n => new NodeDTO { Id = n.Id, Parent = n.Parent }));
});

// clear database
app.MapDelete("/api/{ufType}/database/clear", async (string ufType, DBContext dbContext) => 
{
    await dbContext.Edges.ExecuteDeleteAsync();
    await dbContext.Nodes.ExecuteDeleteAsync();

    return Results.Ok();
});

app.Run();
