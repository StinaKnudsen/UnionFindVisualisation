
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore;

namespace Infrastructure;
public class DBContext : DbContext
{
    public DBContext(DbContextOptions<DBContext> options) : base(options)
    {
    }
    
    public DbSet<Node> Nodes { get; set; }
    public DbSet<Edge> Edges { get; set; }
    public DbSet<Tree> Trees { get; set; }

}