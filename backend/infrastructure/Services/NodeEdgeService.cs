using backend.infrastructure.Entities;

namespace infrastructure.Services;

public interface INodeEdgeService
{
    Task<Edge> GetEdgeAsync(int EdgeId);
}

public class NodeEdgeService : INodeEdgeService
{
    private readonly NodeEdgeRepository _nodeEdgeRepo;
    public NodeEdgeService(NodeEdgeRepository NodeEdgeRepo)
    {
        _nodeEdgeRepo = NodeEdgeRepo;
    }

    public async Task<Edge> GetEdgeAsync(int EdgeId)
    {
        
    }



}
