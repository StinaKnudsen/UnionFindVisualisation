using backend.infrastructure.Entities;
using backend.infrastructure;
using Microsoft.EntityFrameworkCore;

public class PathCompUFService : IUnionFindService
{
    private readonly DBContext _db;

    public PathCompUFService(DBContext db)
    {
        _db = db;
    }

    // Path-compressing Find — after walking to root,
    // point every node on the path directly to the root.
    // Amortized O(α(N)) — effectively constant.
    private int FindRoot(int nodeId, Dictionary<int, Node> nodes)
    {
        if (!nodes.ContainsKey(nodeId))
            throw new Exception($"Node {nodeId} not found");

        // Base case: this node is its own root
        if (nodes[nodeId].Parent == nodeId)
            return nodeId;

        // Recurse to find root, then point current node directly to it
        int root = FindRoot(nodes[nodeId].Parent, nodes);
        nodes[nodeId].Parent = root; // <-- path compression
        return root;
    }

    public async Task<bool> UnionAsync(int nodeAId, int nodeBId)
    {
        var nodes = await _db.Nodes.ToDictionaryAsync(n => n.Id);

        int rootA = FindRoot(nodeAId, nodes);
        int rootB = FindRoot(nodeBId, nodes);

        if (rootA == rootB) return false;

        nodes[rootA].Parent = rootB;

        await _db.SaveChangesAsync();
        return true;
    }
    public async Task RebuildAsync()
    {
        var allNodes = await _db.Nodes.ToListAsync();
        foreach (var node in allNodes)
        {
            node.Parent = node.Id;
        }
        await _db.SaveChangesAsync();

        var nodes = allNodes.ToDictionary(n => n.Id);

        var allEdges = await _db.Edges.ToListAsync();
        foreach (var edge in allEdges)
        {
            int rootA = FindRoot(edge.StartNodeId, nodes);
            int rootB = FindRoot(edge.EndNodeId, nodes);

            if (rootA == rootB) continue;

            nodes[rootA].Parent = rootB;
        }

        await _db.SaveChangesAsync();
    }
}