using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Xunit;

// Additional integration tests that target Program.cs endpoints directly —
// focusing on response bodies, edge-cases, and state transitions that are not
// already covered by UnionFindEndpointTests or EdgeEndpointTests.
public class ProgramEndpointTests : IClassFixture<ApiFactory>, IAsyncLifetime
{
    private readonly HttpClient _client;

    public ProgramEndpointTests(ApiFactory factory)
    {
        _client = factory.CreateClient();
    }

    public async Task InitializeAsync() => await ApiHelpers.ClearDatabaseAsync(_client);
    public Task DisposeAsync() => Task.CompletedTask;

    // -------------------------------------------------------------------------
    // POST /api/{ufType}/edges — response-body validation
    // -------------------------------------------------------------------------

    [Fact]
    public async Task PostEdge_ResponseContainsPositiveEdgeId()
    {
        var result = await ApiHelpers.PostEdgeAsync(_client, "UF", 1, 2);

        result.Should().NotBeNull();
        result!.EdgeId.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task PostEdge_ResponseNodesHaveNonTrivialParent_AfterUnion()
    {
        // After connecting 1→2 the union-find must update a parent pointer —
        // at least one node's Parent should differ from its own Id.
        var result = await ApiHelpers.PostEdgeAsync(_client, "UF", 1, 2);

        var hasUpdatedParent = result!.Nodes.Any(n => n.Parent != n.Id);
        hasUpdatedParent.Should().BeTrue("one node must be attached under the other after a union");
    }

    [Fact]
    public async Task PostEdge_SecondEdgeReusesBothExistingNodes()
    {
        // First edge creates nodes 1 and 2.  Second edge re-uses node 1 (startNode already exists)
        // and creates new node 3 (endNode is null) — exercises both null-check branches.
        await ApiHelpers.PostEdgeAsync(_client, "UF", 1, 2);
        var result = await ApiHelpers.PostEdgeAsync(_client, "UF", 1, 3);

        result!.Nodes.Should().HaveCount(3);
        result.Nodes.Select(n => n.Id).Should().Contain(new[] { 1, 2, 3 });
    }

    [Fact]
    public async Task PostEdge_BothNodesAlreadyExist_DoesNotDuplicateNodes()
    {
        // 1-2 and 3-4 are created separately so all four nodes exist.
        // Then we add 2-3: both startNode and endNode are already in the DB.
        await ApiHelpers.PostEdgeAsync(_client, "UF", 1, 2);
        await ApiHelpers.PostEdgeAsync(_client, "UF", 3, 4);
        var result = await ApiHelpers.PostEdgeAsync(_client, "UF", 2, 3);

        // Still 4 nodes — no duplicates
        result!.Nodes.Should().HaveCount(4);
    }

    [Fact]
    public async Task PostEdge_ReturnsEdgeIdThatCanBeRetrievedViaGetEdge()
    {
        // The edgeId from POST must be a valid key for GET /api/edges/{id}.
        var postResult = await ApiHelpers.PostEdgeAsync(_client, "UF", 5, 6);
        var edgeId = postResult!.EdgeId;

        var getResponse = await _client.GetAsync($"/api/edges/{edgeId}");

        getResponse.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task PostEdge_EdgeIdsAreUniqueAcrossMultipleEdges()
    {
        var r1 = await ApiHelpers.PostEdgeAsync(_client, "UF", 1, 2);
        var r2 = await ApiHelpers.PostEdgeAsync(_client, "UF", 3, 4);
        var r3 = await ApiHelpers.PostEdgeAsync(_client, "UF", 5, 6);

        var ids = new[] { r1!.EdgeId, r2!.EdgeId, r3!.EdgeId };
        ids.Distinct().Should().HaveCount(3, "each POST should receive a unique edgeId");
    }

    // -------------------------------------------------------------------------
    // GET /api/{ufType}/nodes — status code and parent-value checks
    // -------------------------------------------------------------------------

    [Fact]
    public async Task GetNodes_Returns200()
    {
        var response = await _client.GetAsync("/api/UF/nodes");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetNodes_AfterUnion_ReflectsCorrectParentValues()
    {
        // After unioning 1 and 2, the returned nodes must have a shared root —
        // verified through the actual Parent field, not just node count.
        await ApiHelpers.PostEdgeAsync(_client, "UF", 1, 2);

        var nodes = await ApiHelpers.GetNodesAsync(_client, "UF");

        var root1 = ApiHelpers.GetRoot(nodes!, 1);
        var root2 = ApiHelpers.GetRoot(nodes!, 2);
        root1.Should().Be(root2);

        // At least one node must point to the other as parent
        nodes!.Any(n => n.Parent != n.Id).Should().BeTrue();
    }

    [Theory]
    [InlineData("UF")]
    [InlineData("WUF")]
    [InlineData("PCUF")]
    [InlineData("WPCUF")]
    public async Task GetNodes_ReturnsEmptyForEachUfType_AfterClear(string ufType)
    {
        await ApiHelpers.PostEdgeAsync(_client, ufType, 1, 2);
        await ApiHelpers.ClearDatabaseAsync(_client);

        var nodes = await ApiHelpers.GetNodesAsync(_client, ufType);

        nodes.Should().BeEmpty();
        await ApiHelpers.ClearDatabaseAsync(_client);
    }

    // -------------------------------------------------------------------------
    // DELETE /api/{ufType}/edges/{id} — edge cases
    // -------------------------------------------------------------------------

    [Fact]
    public async Task DeleteEdge_NonExistentId_Returns200WithCurrentNodes()
    {
        // DeleteEdgeOnClick silently no-ops for missing edges —
        // the endpoint should still return 200 with whatever nodes currently exist.
        await ApiHelpers.PostEdgeAsync(_client, "UF", 1, 2);

        var response = await _client.DeleteAsync("/api/UF/edges/99999");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task DeleteEdge_NodesPersistAfterEdgeIsDeleted()
    {
        // Deleting an edge does not delete the nodes themselves.
        var created = await ApiHelpers.PostEdgeAsync(_client, "UF", 1, 2);
        await ApiHelpers.DeleteEdgeAsync(_client, "UF", created!.EdgeId);

        var nodes = await ApiHelpers.GetNodesAsync(_client, "UF");

        nodes.Should().HaveCount(2, "nodes are never removed when an edge is deleted");
    }

    [Fact]
    public async Task DeleteEdge_MultipleUndosInSequence_NodesBecomeFullyIsolated()
    {
        // Build chain 1-2-3-4, then undo from the outside in.
        var e12 = await ApiHelpers.PostEdgeAsync(_client, "UF", 1, 2);
        var e23 = await ApiHelpers.PostEdgeAsync(_client, "UF", 2, 3);
        var e34 = await ApiHelpers.PostEdgeAsync(_client, "UF", 3, 4);

        // Undo e34 first
        await ApiHelpers.DeleteEdgeAsync(_client, "UF", e34!.EdgeId);
        // Undo e23
        await ApiHelpers.DeleteEdgeAsync(_client, "UF", e23!.EdgeId);
        // Undo e12 — all nodes should now be isolated
        var nodes = await ApiHelpers.DeleteEdgeAsync(_client, "UF", e12!.EdgeId);

        var root1 = ApiHelpers.GetRoot(nodes!, 1);
        var root2 = ApiHelpers.GetRoot(nodes!, 2);
        var root3 = ApiHelpers.GetRoot(nodes!, 3);
        var root4 = ApiHelpers.GetRoot(nodes!, 4);

        root1.Should().NotBe(root2);
        root2.Should().NotBe(root3);
        root3.Should().NotBe(root4);
    }

    // -------------------------------------------------------------------------
    // DELETE /api/{ufType}/database/clear — all ufTypes and edge cases
    // -------------------------------------------------------------------------

    [Theory]
    [InlineData("UF")]
    [InlineData("WUF")]
    [InlineData("PCUF")]
    [InlineData("WPCUF")]
    public async Task ClearDatabase_Returns200ForAllUfTypes(string ufType)
    {
        var response = await _client.DeleteAsync($"/api/{ufType}/database/clear");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task ClearDatabase_AlreadyEmpty_Returns200()
    {
        // Clearing when nothing exists should not throw — idempotent.
        var response = await _client.DeleteAsync("/api/UF/database/clear");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task ClearDatabase_RemovesEdgeSoGetEdgeReturns404()
    {
        // After clearing, any previously-created edge must no longer be retrievable.
        var postResult = await ApiHelpers.PostEdgeAsync(_client, "UF", 1, 2);
        var edgeId = postResult!.EdgeId;

        await _client.DeleteAsync("/api/UF/database/clear");

        var getResponse = await _client.GetAsync($"/api/edges/{edgeId}");
        getResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task ClearDatabase_TwiceInARow_BothReturn200()
    {
        await ApiHelpers.PostEdgeAsync(_client, "UF", 1, 2);

        var first  = await _client.DeleteAsync("/api/UF/database/clear");
        var second = await _client.DeleteAsync("/api/UF/database/clear");

        first.StatusCode.Should().Be(HttpStatusCode.OK);
        second.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    // -------------------------------------------------------------------------
    // Multi-step state verification
    // -------------------------------------------------------------------------

    [Theory]
    [InlineData("UF")]
    [InlineData("WUF")]
    [InlineData("PCUF")]
    [InlineData("WPCUF")]
    public async Task GetNodes_ReflectsStateAfterEachPostEdge(string ufType)
    {
        // After each union the GET endpoint must reflect the current parent array.
        await ApiHelpers.PostEdgeAsync(_client, ufType, 1, 2);
        var after1 = await ApiHelpers.GetNodesAsync(_client, ufType);
        after1.Should().HaveCount(2);

        await ApiHelpers.PostEdgeAsync(_client, ufType, 3, 4);
        var after2 = await ApiHelpers.GetNodesAsync(_client, ufType);
        after2.Should().HaveCount(4);

        await ApiHelpers.PostEdgeAsync(_client, ufType, 2, 3);
        var after3 = await ApiHelpers.GetNodesAsync(_client, ufType);
        after3.Should().HaveCount(4);

        // All four nodes should now be in one component
        var root1 = ApiHelpers.GetRoot(after3!, 1);
        var root4 = ApiHelpers.GetRoot(after3!, 4);
        root1.Should().Be(root4);

        await ApiHelpers.ClearDatabaseAsync(_client);
    }

    [Fact]
    public async Task DeleteEdge_ThenClear_DatabaseIsEmpty()
    {
        var created = await ApiHelpers.PostEdgeAsync(_client, "UF", 1, 2);
        await ApiHelpers.DeleteEdgeAsync(_client, "UF", created!.EdgeId);
        await ApiHelpers.ClearDatabaseAsync(_client);

        var nodes = await ApiHelpers.GetNodesAsync(_client, "UF");
        nodes.Should().BeEmpty();
    }
}
