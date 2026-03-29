
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore;
using backend.infrastructure.Entities;
using SQLitePCL;

namespace backend.infrastructure;
public class DBContext : DbContext
{
    public DBContext(DbContextOptions<DBContext> options) : base(options)
    {
    }
    
    public DbSet<Node> Nodes { get; set; }
    public DbSet<Edge> Edges { get; set; }
   

}