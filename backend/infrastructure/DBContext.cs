
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore;


public class DBContext : DbContext
{
    public DBContext(DbContextOptions<DBContext> options) : base(options)
    {
    }
    //public DbSet<Cheep> Cheeps { get; set; }
    

}