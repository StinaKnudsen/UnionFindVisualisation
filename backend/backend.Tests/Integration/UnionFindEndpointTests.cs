using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Xunit;

// Tests for POST /api/{ufType}/edges, DELETE /api/{ufType}/edges/{id},
// GET /api/{ufType}/nodes, DELETE /api/{ufType}/database/clear
public class UnionFindEndpointTests : IClassFixture<ApiFactory>, IAsyncLifetime
{
    private readonly HttpClient _client;

    public UnionFindEndpointTests(ApiFactory factory)
    {
        _client = factory.CreateClient();
    }

    public async Task InitializeAsync() => await ApiHelpers.ClearDatabaseAsync(_client);
    public Task DisposeAsync() => Task.CompletedTask;

    // --- POST /api/{ufType}/edges ---

    [Theory]
    [InlineData("UF")]
    [InlineData("WUF")]
    [InlineData("PCUF")]
    [InlineData("WPCUF")]
    public async Task PostEdge_NewNodes_Returns200WithEdgeIdAndNodes(string ufType)
    {
        var result = await ApiHelpers.PostEdgeAsync(_client, ufType, 1, 2);

        result.Should().NotBeNull();
        result!.EdgeId.Should().BeGreaterThan(0);
        result.Nodes.Should().HaveCount(2);
        result.Nodes.Should().Contain(n => n.Id == 1);
        result.Nodes.Should().Contain(n => n.Id == 2);

        await ApiHelpers.ClearDatabaseAsync(_client);
    }

    [Theory]
    [InlineData("UF")]
    [InlineData("WUF")]
    [InlineData("PCUF")]
    [InlineData("WPCUF")]
    public async Task PostEdge_UnionsTheNodes_NodesShareSameRoot(string ufType)
    {
        var result = await ApiHelpers.PostEdgeAsync(_client, ufType, 1, 2);

        var root1 = ApiHelpers.GetRoot(result!.Nodes, 1);
        var root2 = ApiHelpers.GetRoot(result.Nodes, 2);
        root1.Should().Be(root2);

        await ApiHelpers.ClearDatabaseAsync(_client);
    }

    [Fact]
    public async Task PostEdge_NodeAlreadyExists_DoesNotCreateDuplicate()
    {
        // Create node 1 and 2
        await ApiHelpers.PostEdgeAsync(_client, "UF", 1, 2);
        // Now add another edge involving node 1
        var result = await ApiHelpers.PostEdgeAsync(_client, "UF", 1, 3);

        // Should still only have 3 nodes total, not 4
        result!.Nodes.Should().HaveCount(3);
    }

    [Fact]
    public async Task PostEdge_UnknownUfType_ThrowsException()
    {
        // Without exception-handling middleware, an unknown ufType causes the
        // ArgumentException from DetermineUF to bubble up through the HttpClient.
        var act = async () => await _client.PostAsJsonAsync(
            "/api/INVALID/edges",
            new { StartNodeId = 1, EndNodeId = 2 });

        await act.Should().ThrowAsync<Exception>().WithMessage("*INVALID*");
    }

    // --- GET /api/{ufType}/nodes ---

    [Fact]
    public async Task GetNodes_EmptyDatabase_ReturnsEmptyArray()
    {
        var nodes = await ApiHelpers.GetNodesAsync(_client, "UF");

        nodes.Should().NotBeNull();
        nodes.Should().BeEmpty();
    }

    [Fact]
    public async Task GetNodes_AfterAddingEdges_ReturnsAllNodes()
    {
        await ApiHelpers.PostEdgeAsync(_client, "UF", 1, 2);
        await ApiHelpers.PostEdgeAsync(_client, "UF", 3, 4);

        var nodes = await ApiHelpers.GetNodesAsync(_client, "UF");

        nodes.Should().HaveCount(4);
    }

    // --- DELETE /api/{ufType}/edges/{id} ---

    [Theory]
    [InlineData("UF")]
    [InlineData("WUF")]
    [InlineData("PCUF")]
    [InlineData("WPCUF")]
    public async Task DeleteEdge_ExistingEdge_Returns200WithNodes(string ufType)
    {
        var created = await ApiHelpers.PostEdgeAsync(_client, ufType, 1, 2);

        var nodes = await ApiHelpers.DeleteEdgeAsync(_client, ufType, created!.EdgeId);

        nodes.Should().NotBeNull();
        nodes.Should().HaveCount(2);

        await ApiHelpers.ClearDatabaseAsync(_client);
    }

    [Fact]
    public async Task DeleteEdge_RebuildsMakesNodesDisconnected()
    {
        // Connect 1-2, then delete that edge — 1 and 2 should no longer share a root
        var created = await ApiHelpers.PostEdgeAsync(_client, "UF", 1, 2);
        var nodes = await ApiHelpers.DeleteEdgeAsync(_client, "UF", created!.EdgeId);

        var root1 = ApiHelpers.GetRoot(nodes!, 1);
        var root2 = ApiHelpers.GetRoot(nodes!, 2);
        root1.Should().NotBe(root2);
    }

    [Fact]
    public async Task DeleteEdge_PartialDisconnection_KeepsRemainingComponentsIntact()
    {
        // 1-2-3 chain via two edges
        var edge1 = await ApiHelpers.PostEdgeAsync(_client, "UF", 1, 2);
        await ApiHelpers.PostEdgeAsync(_client, "UF", 2, 3);

        // Delete 1-2 edge — nodes 2 and 3 should still be connected
        var nodes = await ApiHelpers.DeleteEdgeAsync(_client, "UF", edge1!.EdgeId);

        var root2 = ApiHelpers.GetRoot(nodes!, 2);
        var root3 = ApiHelpers.GetRoot(nodes!, 3);
        var root1 = ApiHelpers.GetRoot(nodes!, 1);

        root2.Should().Be(root3);
        root1.Should().NotBe(root2);
    }

    // --- DELETE /api/{ufType}/database/clear ---

    [Fact]
    public async Task ClearDatabase_Returns200()
    {
        await ApiHelpers.PostEdgeAsync(_client, "UF", 1, 2);

        var response = await _client.DeleteAsync("/api/UF/database/clear");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task ClearDatabase_RemovesAllNodesAndEdges()
    {
        await ApiHelpers.PostEdgeAsync(_client, "UF", 1, 2);
        await ApiHelpers.PostEdgeAsync(_client, "UF", 3, 4);

        await _client.DeleteAsync("/api/UF/database/clear");

        var nodes = await ApiHelpers.GetNodesAsync(_client, "UF");
        nodes.Should().BeEmpty();
    }
}
