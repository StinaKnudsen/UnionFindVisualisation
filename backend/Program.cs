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

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<DBContext>();
    db.Database.EnsureDeleted();       // Drop the database
    db.Database.Migrate();             // Recreate using migrations
}

app.UseCors("AllowFrontend");

app.MapGet("/api/edges/{id:int}", async (int id, NodeEdgeService NEService) =>
{
    var edge = await NEService.GetEdgeAsync(id);
    return edge is null ? Results.NotFound() : Results.Ok(edge);
});

app.MapPost("/api/edges", async (EdgeDTO edge, DBContext dbContext, UnionFindService uf) =>
{
    var startNode = await dbContext.Nodes.FindAsync(edge.StartNodeId);
    if (startNode == null)
    {
        startNode = new Node { Id = edge.StartNodeId, Parent = -1 };
        dbContext.Nodes.Add(startNode);
        await dbContext.SaveChangesAsync();
    }

    var endNode = await dbContext.Nodes.FindAsync(edge.EndNodeId);
    if (endNode == null)
    {
        endNode = new Node { Id = edge.EndNodeId, Parent = -1 };
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

app.MapDelete("/api/edges/{id:int}", async (int id, NodeEdgeService NEService, UnionFindService uf, DBContext dbContext) =>
{
    await NEService.DeleteEdgeOnClick(id);
    await uf.RebuildAsync();

    var nodes = await dbContext.Nodes.ToListAsync();
    return Results.Ok(nodes.Select(n => new NodeDTO { Id = n.Id, Parent = n.Parent }));
});

app.MapGet("/api/nodes", async (DBContext dbContext) =>
{
    var nodes = await dbContext.Nodes.ToListAsync();
    return Results.Ok(nodes.Select(n => new NodeDTO { Id = n.Id, Parent = n.Parent }));
});

app.Run();
