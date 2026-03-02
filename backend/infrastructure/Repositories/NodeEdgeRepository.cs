using Core.Interfaces;
using backend.infrastructure.Entities;



namespace backend.infrastructure.Repositories;

public class NodeEdgeRepository : INodeEdgeRepository
{
    private readonly DBContext _dbContext;

    public NodeEdgeRepository(DBContext dbContext)
    {
        _dbContext = dbContext;
    }
    public async Task<Edge> CreateEdge(int startNodeId, int endNodeId, int id)
    {
        var edge = new Edge (){Id = id, StartNodeId = startNodeId, EndNodeId = endNodeId};
        await _dbContext.Edges.AddAsync(edge);
        await _dbContext.SaveChangesAsync();

        return edge;

    }
    public async Task<Edge> GetEdgeFromId(int EdgeId)
    {
        return await _dbContext.Edges.GetEdgeAsync(EdgeId);
    }
    public async Task<Edge> DeleteEdgeOnClick(int EdgeId)
    {
        return null;
    }
    public async Task<Edge> DeleteLastCreatedEdge(int EdgeId)
    {
        return null;
    }
}