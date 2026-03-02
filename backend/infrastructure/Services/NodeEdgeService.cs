using backend.infrastructure.Entities;
using backend.infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Core.Interfaces;

namespace backend.infrastructure.Services;


public interface INodeEdgeService
{
    Task<Edge?> GetEdgeAsync(int EdgeId);
}

public class NodeEdgeService : INodeEdgeService
{
    private readonly INodeEdgeRepository _nodeEdgeRepo;
    public NodeEdgeService(INodeEdgeRepository NodeEdgeRepo)
    {
        _nodeEdgeRepo = NodeEdgeRepo; 
    }

    public async Task<Edge?> GetEdgeAsync(int EdgeId)
    {
        return await _nodeEdgeRepo.GetEdge(EdgeId);
    } 


}
