using backend.infrastructure;
using backend.infrastructure.Entities;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Xunit;

public class UnionFindServiceTests : IDisposable
{
    private readonly DBContext _db;
    private readonly SqliteConnection _connection;
    private readonly UnionFindService _sut;

    public UnionFindServiceTests()
    {
        (_db, _connection) = TestDbHelper.Create();
        _sut = new UnionFindService(_db);
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
    public async Task Union_TwoDisconnectedNodes_UpdatesParent()
    {
        AddNodes(1, 2);

        await _sut.UnionAsync(1, 2);

        // Basic UF sets rootB.Parent = rootA, so node 2 points to node 1
        var node2 = await _db.Nodes.FindAsync(2);
        node2!.Parent.Should().Be(1);
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

    // --- RebuildAsync ---

    [Fact]
    public async Task Rebuild_WithNoEdges_AllNodesAreTheirOwnRoot()
    {
        AddNodes(1, 2, 3);
        await _sut.UnionAsync(1, 2);
        await _sut.UnionAsync(2, 3);
        // Remove all edges so rebuild has nothing to union
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
        // No edge between 2 and 3

        await _sut.RebuildAsync();

        var root1 = await _sut.FindAsync(1);
        var root2 = await _sut.FindAsync(2);
        var root3 = await _sut.FindAsync(3);

        root1.Should().Be(root2);       // 1 and 2 are connected via edge
        root3.Should().NotBe(root1);    // 3 is isolated
    }

    [Fact]
    public async Task Rebuild_AfterEdgeDeletion_DisconnectsNodes()
    {
        AddNodes(1, 2, 3);
        AddEdge(1, 2);
        AddEdge(2, 3);
        await _sut.UnionAsync(1, 2);
        await _sut.UnionAsync(2, 3);

        // Delete edge between 2 and 3
        var edge = _db.Edges.First(e => e.StartNodeId == 2 && e.EndNodeId == 3);
        _db.Edges.Remove(edge);
        _db.SaveChanges();

        await _sut.RebuildAsync();

        var root1 = await _sut.FindAsync(1);
        var root2 = await _sut.FindAsync(2);
        var root3 = await _sut.FindAsync(3);

        root1.Should().Be(root2);       // Still connected via remaining edge
        root3.Should().NotBe(root1);    // Disconnected after edge removal
    }

    public void Dispose()
    {
        _db.Dispose();
        _connection.Dispose();
    }
}
