using backend.infrastructure.Entities;
using backend.infrastructure;
using Microsoft.EntityFrameworkCore;

public class WeightedPathCompUFService : IUnionFindService
{
    private readonly DBContext _db;

    public WeightedPathCompUFService(DBContext db)
    {
        _db = db;
    }

    // Path-compressing Find — after walking to root,
    // point every node on the path directly to the root.
    // Amortized O(α(N)) — effectively constant.
    public async Task<int> FindAsync(int nodeId)
    {
        var nodes = await _db.Nodes.ToDictionaryAsync(n => n.Id);

        if (!nodes.ContainsKey(nodeId))
            throw new Exception($"Node {nodeId} not found");

        if (nodes[nodeId].Parent == nodeId)
            return nodeId;

        int root = await FindAsync(nodes[nodeId].Parent);
        nodes[nodeId].Parent = root;

        await _db.SaveChangesAsync();
        return root;
    }

    public async Task<bool> UnionAsync(int nodeAId, int nodeBId)
    {
        var nodes = await _db.Nodes.ToDictionaryAsync(n => n.Id);

        int rootA = await FindAsync(nodeAId);
        int rootB = await FindAsync(nodeBId);

        if (rootA == rootB) return false;

        if (nodes[rootA].Size < nodes[rootB].Size)
        {
            nodes[rootA].Parent = rootB;
            nodes[rootB].Size += nodes[rootA].Size;
        }
        else
        {
            nodes[rootB].Parent = rootA;
            nodes[rootA].Size += nodes[rootB].Size;
        }

        await _db.SaveChangesAsync();
        return true;
    }

    public async Task RebuildAsync()
    {
        var allNodes = await _db.Nodes.ToListAsync();
        foreach (var node in allNodes)
        {
            node.Parent = node.Id;
            node.Size = 1;
        }
        await _db.SaveChangesAsync();

        var nodes = allNodes.ToDictionary(n => n.Id);

        var allEdges = await _db.Edges.ToListAsync();
        foreach (var edge in allEdges)
        {
            int rootA = await FindAsync(edge.StartNodeId);
            int rootB = await FindAsync(edge.EndNodeId);

            if (rootA == rootB) continue;

            if (nodes[rootA].Size < nodes[rootB].Size)
            {
                nodes[rootA].Parent = rootB;
                nodes[rootB].Size += nodes[rootA].Size;
            }
            else
            {
                nodes[rootB].Parent = rootA;
                nodes[rootA].Size += nodes[rootB].Size;
            }
        }

        await _db.SaveChangesAsync();
    }

}