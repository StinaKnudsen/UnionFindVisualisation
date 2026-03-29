using backend.infrastructure.Entities;
using backend.infrastructure;
using Microsoft.EntityFrameworkCore;

// Implemented based on Algorithms 4th Edition by Sedgewick and Wayne p. 228
public class WeightedUFService
{
    private readonly DBContext _db;

    public WeightedUFService(DBContext db)
    {
        _db = db;
    }

    // Find - walk up parents until we hit a root (Parent == -1)
    // Weighted so should be O(log N)
    private int FindRoot(int nodeId, Dictionary<int, Node> nodes)
    {
        if (!nodes.ContainsKey(nodeId))
            throw new Exception($"Node {nodeId} not found");

        int current = nodeId;

        // Walk up to root — root is the node where Parent == -1
        while (nodes[current].Parent != -1)
            current = nodes[current].Parent;

        return current;
    }

    // Public async wrapper
    public async Task<int> FindAsync(int nodeId)
    {
        var nodes = await _db.Nodes.ToDictionaryAsync(n => n.Id);
        return FindRoot(nodeId, nodes);
    }

    // Weighted union — attach smaller tree under larger tree
    // Should be O(log N)
    public async Task<bool> UnionAsync(int nodeAId, int nodeBId)
    {
        var nodes = await _db.Nodes.ToDictionaryAsync(n => n.Id);

        int rootA = FindRoot(nodeAId, nodes);
        int rootB = FindRoot(nodeBId, nodes);

        // Already connected — nothing to do
        if (rootA == rootB) return false;

        // Attach smaller tree under larger tree (weighted union)
        // This keeps the tree shallow — O(log N) depth guaranteed
        if (nodes[rootA].Size < nodes[rootB].Size)
        {
            // rootA is smaller — point it to rootB
            nodes[rootA].Parent = rootB;
            nodes[rootB].Size += nodes[rootA].Size;
        }
        else
        {
            // rootB is smaller (or equal) — point it to rootA
            nodes[rootB].Parent = rootA;
            nodes[rootA].Size += nodes[rootB].Size;
        }

        await _db.SaveChangesAsync();
        return true;
    }

    // Check if two nodes are in the same component
    public async Task<bool> ConnectedAsync(int nodeAId, int nodeBId)
    {
        var nodes = await _db.Nodes.ToDictionaryAsync(n => n.Id);
        return FindRoot(nodeAId, nodes) == FindRoot(nodeBId, nodes);
    }

    // Count of distinct components (nodes that are their own root)
    public async Task<int> CountAsync()
    {
        return await _db.Nodes.CountAsync(n => n.Parent == -1);
    }

    public async Task RebuildAsync()
    {
        // Reset all nodes to be their own root and size 1
        var allNodes = await _db.Nodes.ToListAsync();
        foreach (var node in allNodes)
        {
            node.Parent = -1;
            node.Size = 1;
        }
        await _db.SaveChangesAsync();

        var nodes = allNodes.ToDictionary(n => n.Id);

        //re-union all edges using weighted union
        var allEdges = await _db.Edges.ToListAsync();
        foreach (var edge in allEdges)
        {
            int rootA = FindRoot(edge.StartNodeId, nodes);
            int rootB = FindRoot(edge.EndNodeId, nodes);

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