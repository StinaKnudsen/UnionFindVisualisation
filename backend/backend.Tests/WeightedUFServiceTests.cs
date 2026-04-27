using backend.infrastructure;
using backend.infrastructure.Entities;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Xunit;

public class WeightedUFServiceTests : IDisposable
{
    private readonly DBContext _db;
    private readonly SqliteConnection _connection;
    private readonly WeightedUFService _sut;

    public WeightedUFServiceTests()
    {
        (_db, _connection) = TestDbHelper.Create();
        _sut = new WeightedUFService(_db);
    }

    private void AddNodes(params int[] ids)
    {
        foreach (var id in ids)
            _db.Nodes.Add(new Node { Id = id, Parent = id, Size = 1 });
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
    public async Task Union_AlreadyConnectedNodes_ReturnsFalse()
    {
        AddNodes(1, 2);
        await _sut.UnionAsync(1, 2);

        var result = await _sut.UnionAsync(1, 2);

        result.Should().BeFalse();
    }

    [Fact]
    public async Task Union_EqualSizeTrees_AttachesRootBUnderRootA()
    {
        // Both start with size 1, so rootB goes under rootA (else branch)
        AddNodes(1, 2);

        await _sut.UnionAsync(1, 2);

        var node2 = await _db.Nodes.FindAsync(2);
        node2!.Parent.Should().Be(1);
    }

    [Fact]
    public async Task Union_SmallerTreeUnderLarger_AttachesCorrectly()
    {
        // Make node 2 the root of a larger tree (size 2) before unioning with node 1 (size 1)
        AddNodes(1, 2, 3);
        await _sut.UnionAsync(2, 3); // node 2 is now root with size 2

        await _sut.UnionAsync(1, 2); // node 1 (size 1) should go under node 2 (size 2)

        var node1 = await _db.Nodes.FindAsync(1);
        node1!.Parent.Should().Be(2);
    }

    [Fact]
    public async Task Union_UpdatesSizeOfNewRoot()
    {
        AddNodes(1, 2);

        await _sut.UnionAsync(1, 2);

        // Node 1 becomes root (equal sizes → else branch), so its size should be 2
        var node1 = await _db.Nodes.FindAsync(1);
        node1!.Size.Should().Be(2);
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
    public async Task Rebuild_WithNoEdges_AllNodesAreTheirOwnRootWithSizeOne()
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
        nodes[1].Size.Should().Be(1);
        nodes[2].Size.Should().Be(1);
        nodes[3].Size.Should().Be(1);
    }

    // --- FindRoot throw ---

    [Fact]
    public async Task Union_NodeDoesNotExist_ThrowsException()
    {
        AddNodes(1);

        var act = async () => await _sut.UnionAsync(999, 1);

        await act.Should().ThrowAsync<Exception>().WithMessage("*999*");
    }

    // --- RebuildAsync branches ---

    [Fact]
    public async Task Rebuild_WithDuplicateEdges_SkipsAlreadyConnectedPairs()
    {
        // Two edges connecting the same nodes — second one hits the `continue` branch
        AddNodes(1, 2);
        AddEdge(1, 2);
        AddEdge(1, 2);

        var act = async () => await _sut.RebuildAsync();

        await act.Should().NotThrowAsync();
        var nodes = _db.Nodes.ToDictionary(n => n.Id);
        GetRoot(nodes, 1).Should().Be(GetRoot(nodes, 2));
    }

    [Fact]
    public async Task Rebuild_SmallRootUnderLargeRoot_AttachesCorrectly()
    {
        // Edge (2,3) is processed first → node 2 becomes root with size 2.
        // Edge (1,2) is processed next → root of 1 has size 1, root of 2 has size 2
        // → triggers the "rootA.Size < rootB.Size" branch → node 1 goes under node 2.
        AddNodes(1, 2, 3);
        AddEdge(2, 3);
        AddEdge(1, 2);

        await _sut.RebuildAsync();

        var nodes = _db.Nodes.ToDictionary(n => n.Id);
        nodes[1].Parent.Should().Be(2); // smaller root attached under larger
    }

    [Fact]
    public async Task Rebuild_WithEdges_ReunionsAndUpdatesSizes()
    {
        AddNodes(1, 2, 3);
        AddEdge(1, 2);

        await _sut.RebuildAsync();

        // 1 and 2 are connected, 3 is isolated
        var nodes = _db.Nodes.ToDictionary(n => n.Id);
        var root1 = nodes[1].Parent == 1 ? 1 : nodes[nodes[1].Parent].Id;
        nodes[3].Parent.Should().Be(3);
        nodes[3].Size.Should().Be(1);

        // The root of the {1,2} component should have size 2
        var rootNode = nodes.Values.First(n => n.Parent == n.Id && n.Id != 3);
        rootNode.Size.Should().Be(2);
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
