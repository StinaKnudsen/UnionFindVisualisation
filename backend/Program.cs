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

string? connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<DBContext>(options =>
    options.UseSqlite(connectionString, b => b.MigrationsAssembly("backend")));

builder.Services.AddScoped<INodeEdgeRepository, NodeEdgeRepository>();
builder.Services.AddScoped<NodeEdgeService>();

var app = builder.Build();


app.MapGet("/api/edges/{id:int}", async (int id, NodeEdgeService NEService) =>
{
    var edge = await NEService.GetEdgeAsync(id);
    return edge is null ? Results.NotFound() : Results.Ok(edge);
});

app.MapPost("/api/edges", async (EdgeDTO edge, DBContext dbContext) =>
{
    var startNode = await dbContext.Nodes.FindAsync(edge.StartNodeId);
    if (startNode == null)
    {
        startNode = new Node { Id = startNode.Id};
        dbContext.Nodes.Add(startNode);
    }

    var endNode = await dbContext.Nodes.FindAsync(edge.EndNodeId);
    if (endNode == null)
    {
        endNode = new Node { Id = endNode.Id};
        dbContext.Nodes.Add(endNode);
    }

    var newEdge = new Edge
    {
        Id = edge.Id,
        StartNodeId = edge.StartNodeId,
        EndNodeId = edge.EndNodeId
    };

    dbContext.Edges.Add(newEdge);
    await dbContext.SaveChangesAsync();
} 
);

app.Run();
