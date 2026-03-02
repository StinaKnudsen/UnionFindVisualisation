using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore;
using backend.infrastructure;
using Core.Interfaces;
using backend.infrastructure.Repositories;
using backend.infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);


string? connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<DBContext>(options =>
    options.UseSqlite(connectionString, b => b.MigrationsAssembly("backend")));


var app = builder.Build();

builder.Services.AddScoped<INodeEdgeRepository, NodeEdgeRepository>();
builder.Services.AddScoped<NodeEdgeService>();

app.MapGet("/api/edges/{id:int}", async (int id, NodeEdgeService NEService) =>
{
    var edge = await NEService.GetEdgeAsync(id);
    return edge is null ? Results.NotFound() : Results.Ok(edge);
});


app.Run();
