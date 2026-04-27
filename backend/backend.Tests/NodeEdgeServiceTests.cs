using backend.infrastructure;
using backend.infrastructure.Entities;
using backend.infrastructure.Repositories;
using backend.infrastructure.Services;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Xunit;

public class NodeEdgeServiceTests : IDisposable
{
    private readonly DBContext _db;
    private readonly SqliteConnection _connection;
    private readonly NodeEdgeService _sut;

    public NodeEdgeServiceTests()
    {
        (_db, _connection) = TestDbHelper.Create();
        var repo = new NodeEdgeRepository(_db);
        _sut = new NodeEdgeService(repo);
    }

    private Edge AddEdge(int start, int end)
    {
        var edge = new Edge { StartNodeId = start, EndNodeId = end };
        _db.Edges.Add(edge);
        _db.SaveChanges();
        return edge;
    }

    // --- GetEdgeAsync ---

    [Fact]
    public async Task GetEdgeAsync_ExistingEdge_ReturnsEdge()
    {
        var edge = AddEdge(1, 2);

        var result = await _sut.GetEdgeAsync(edge.Id);

        result.Should().NotBeNull();
        result!.StartNodeId.Should().Be(1);
        result.EndNodeId.Should().Be(2);
    }

    [Fact]
    public async Task GetEdgeAsync_NonExistingEdge_ReturnsNull()
    {
        var result = await _sut.GetEdgeAsync(999);

        result.Should().BeNull();
    }

    // --- DeleteEdgeOnClick ---

    [Fact]
    public async Task DeleteEdgeOnClick_ExistingEdge_RemovesItFromDatabase()
    {
        var edge = AddEdge(1, 2);

        await _sut.DeleteEdgeOnClick(edge.Id);

        var deleted = await _db.Edges.FindAsync(edge.Id);
        deleted.Should().BeNull();
    }

    [Fact]
    public async Task DeleteEdgeOnClick_NonExistingEdge_DoesNotThrow()
    {
        var act = async () => await _sut.DeleteEdgeOnClick(999);

        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task DeleteEdgeOnClick_OnlyDeletesTargetEdge_LeavesOthersIntact()
    {
        var edge1 = AddEdge(1, 2);
        var edge2 = AddEdge(3, 4);

        await _sut.DeleteEdgeOnClick(edge1.Id);

        var remaining = await _db.Edges.FindAsync(edge2.Id);
        remaining.Should().NotBeNull();
    }

    public void Dispose()
    {
        _db.Dispose();
        _connection.Dispose();
    }
}
