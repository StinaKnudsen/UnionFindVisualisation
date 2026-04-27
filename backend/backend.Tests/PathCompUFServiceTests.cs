using backend.infrastructure;
using backend.infrastructure.Entities;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Xunit;

public class PathCompUFServiceTests : IDisposable
{
    private readonly DBContext _db;
    private readonly SqliteConnection _connection;
    private readonly PathCompUFService _sut;

    public PathCompUFServiceTests()
    {
        (_db, _connection) = TestDbHelper.Create();
        _sut = new PathCompUFService(_db);
    }

    private void AddNodes(params int[] ids)
    {
        foreach (var id in ids)
            _db.Nodes.Add(new Node { Id = id, Parent = id });
        _db.SaveChanges();
    }

    private void AddEdge(int start, int end)
    {
        _db.Edges.Add(new Edge { StartNodeId = start, EndNodeId = end });
        _db.SaveChanges();
    }

    // --- UnionAsync ---

    [Fact]
    public async Task Union_TwoDisconnectedNodes_ReturnsTrue()
    {
        AddNodes(1, 2);

        var result = await _sut.UnionAsync(1, 2);

        result.Should().BeTrue();
    }

    [Fact]
    public async Task Union_TwoDisconnectedNodes_ConnectsThem()
    {
        AddNodes(1, 2);

        await _sut.UnionAsync(1, 2);

        // After union, one node must point to the other
        var node1 = await _db.Nodes.FindAsync(1);
        var node2 = await _db.Nodes.FindAsync(2);
        var sameComponent = node1!.Parent == node2!.Id || node2.Parent == node1.Id
                            || node1.Parent == node1.Id && node2.Parent == node1.Id
                            || node1.Parent == node2.Id && node2.Parent == node2.Id;
        sameComponent.Should().BeTrue();
    }

    [Fact]
    public async Task Union_AlreadyConnectedNodes_ReturnsFalse()
    {
        AddNodes(1, 2);
        await _sut.UnionAsync(1, 2);

        var result = await _sut.UnionAsync(1, 2);

        result.Should().BeFalse();
    }

    [Fact]
    public async Task Union_TransitivelyConnectedNodes_ReturnsFalse()
    {
        AddNodes(1, 2, 3);
        await _sut.UnionAsync(1, 2);
        await _sut.UnionAsync(2, 3);

        var result = await _sut.UnionAsync(1, 3);

        result.Should().BeFalse();
    }

    // --- Path compression ---

    [Fact]
    public async Task Union_PathCompression_FlattensTwoHopChain()
    {
        // Build chain: 3 -> 2 -> 1 (1 is root) manually
        AddNodes(1, 2, 3);
        var node2 = await _db.Nodes.FindAsync(2);
        var node3 = await _db.Nodes.FindAsync(3);
        node2!.Parent = 1;
        node3!.Parent = 2;
        await _db.SaveChangesAsync();

        // Calling UnionAsync triggers FindRoot on node 3, which should compress the path
        await _sut.UnionAsync(3, 3); // union with itself to trigger find without changing structure

        // After path compression, node 3 should point directly to root (1)
        var refreshed = await _db.Nodes.FindAsync(3);
        refreshed!.Parent.Should().Be(1);
    }

    // --- RebuildAsync ---

    [Fact]
    public async Task Rebuild_WithNoEdges_AllNodesAreTheirOwnRoot()
    {
        AddNodes(1, 2, 3);
        await _sut.UnionAsync(1, 2);
        await _sut.UnionAsync(2, 3);
        _db.Edges.RemoveRange(_db.Edges.ToList());
        _db.SaveChanges();

        await _sut.RebuildAsync();

        var nodes = _db.Nodes.ToDictionary(n => n.Id);
        nodes[1].Parent.Should().Be(1);
        nodes[2].Parent.Should().Be(2);
        nodes[3].Parent.Should().Be(3);
    }

    [Fact]
    public async Task Rebuild_WithEdges_ReunionsCorrectly()
    {
        AddNodes(1, 2, 3);
        AddEdge(1, 2);

        await _sut.RebuildAsync();

        // 1 and 2 should share a root; 3 should be isolated
        var nodes = _db.Nodes.ToDictionary(n => n.Id);
        var root1 = GetRoot(nodes, 1);
        var root2 = GetRoot(nodes, 2);
        var root3 = GetRoot(nodes, 3);

        root1.Should().Be(root2);
        root3.Should().NotBe(root1);
    }

    // --- FindRoot throw ---

    [Fact]
    public async Task Union_NodeDoesNotExist_ThrowsException()
    {
        AddNodes(1);

        var act = async () => await _sut.UnionAsync(999, 1);

        await act.Should().ThrowAsync<Exception>().WithMessage("*999*");
    }

    private static int GetRoot(Dictionary<int, Node> nodes, int id)
    {
        while (nodes[id].Parent != id)
            id = nodes[id].Parent;
        return id;
    }

    public void Dispose()
    {
        _db.Dispose();
        _connection.Dispose();
    }
}
