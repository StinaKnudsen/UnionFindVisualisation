using Core.Interfaces;
using backend.infrastructure.Entities;
using Microsoft.EntityFrameworkCore;


namespace backend.infrastructure.Repositories;

public class NodeEdgeRepository : INodeEdgeRepository
{
    private readonly DBContext _dbContext;

    public NodeEdgeRepository(DBContext dbContext)
    {
        _dbContext = dbContext;
    }
    
    public async Task<Edge?> GetEdge(int EdgeId)
    {
        return await _dbContext.Edges.FindAsync(EdgeId);
    }
    public async Task DeleteEdgeOnClick(int EdgeId)
    {
        var findEdge = await _dbContext.Edges.FindAsync(EdgeId);
        if (findEdge == null) { return; }
        
        _dbContext.Remove<Edge>(findEdge);
        await _dbContext.SaveChangesAsync();
    }
}