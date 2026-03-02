using System.Globalization;
using backend.infrastructure.Entities;
namespace Core.Interfaces;
public interface INodeEdgeRepository
{
    Task<Edge> CreateEdge(int startNodeId, int endNodeId, int id);
    Task<Edge> GetEdgeFromId(string EdgeIdQuery);
    Task<Edge> DeleteEdgeOnClick(int EdgeId);
    Task<Edge> DeleteLastCreatedEdge(int EdgeId);
}


/*
Funktioner der skal med:

- create edge between two nodes
- get edge when clicking
- delete edge on click
- delete latest created edge

*/