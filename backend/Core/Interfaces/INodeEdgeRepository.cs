using backend.infrastructure.Entities;
namespace Core.Interfaces;
public interface INodeEdgeRepository
{
    Task<Edge?> GetEdge(int EdgeId);
    Task DeleteEdgeOnClick(int EdgeId);

}