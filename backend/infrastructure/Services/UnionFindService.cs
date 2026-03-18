using backend.infrastructure;

public class UnionFindService
{
    private readonly DBContext _db;

    public UnionFindService(DBContext db)
    {
        _db = db;
    }

    // Find - walk up parents until we hit a root (Parent == -1)
    public async Task<int> FindAsync(int nodeId)
    {
        var node = await _db.Nodes.FindAsync(nodeId)
            ?? throw new Exception($"Node {nodeId} not found");

        if (node.Parent == -1) return node.Id;

        return await FindAsync(node.Parent);
    }

    // Union
    public async Task<bool> UnionAsync(int nodeAId, int nodeBId)
    {
        int rootA = await FindAsync(nodeAId);
        int rootB = await FindAsync(nodeBId);

        if (rootA == rootB) return false; // Already in same set

        var nodeB = await _db.Nodes.FindAsync(rootB)!;
        nodeB!.Parent = rootA;

        await _db.SaveChangesAsync();
        return true;
    }

    public async Task RebuildAsync()
    {
        // Reset all nodes to be their own root
        var allNodes = _db.Nodes.ToList();
        foreach (var node in allNodes)
        {
            node.Parent = -1;
        }
        await _db.SaveChangesAsync();

        // Re-union all remaining edges
        var allEdges = _db.Edges.ToList();
        foreach (var edge in allEdges)
        {
            await UnionAsync(edge.StartNodeId, edge.EndNodeId);
        }
    }

}