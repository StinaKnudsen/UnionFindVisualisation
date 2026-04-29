using FluentAssertions;
using Xunit;

// End-to-end tests that simulate realistic user workflows through the full HTTP stack.
// Each scenario mimics a user building and modifying a graph in the visualisation tool.
public class UnionFindScenarioTests : IClassFixture<ApiFactory>, IAsyncLifetime
{
    private readonly HttpClient _client;

    public UnionFindScenarioTests(ApiFactory factory)
    {
        _client = factory.CreateClient();
    }

    public async Task InitializeAsync() => await ApiHelpers.ClearDatabaseAsync(_client);
    public Task DisposeAsync() => Task.CompletedTask;

    // Scenario 1: User builds a simple chain A-B-C and verifies all three nodes
    // end up in the same component, then deletes one edge and verifies the split.
    [Theory]
    [InlineData("UF")]
    [InlineData("WUF")]
    [InlineData("PCUF")]
    [InlineData("WPCUF")]
    public async Task Scenario_BuildChainThenDeleteEdge_SplitsComponentCorrectly(string ufType)
    {
        // Build: 1 -- 2 -- 3
        var edge12 = await ApiHelpers.PostEdgeAsync(_client, ufType, 1, 2);
        var edge23 = await ApiHelpers.PostEdgeAsync(_client, ufType, 2, 3);

        // All three should be in the same component
        var root1 = ApiHelpers.GetRoot(edge23!.Nodes, 1);
        var root2 = ApiHelpers.GetRoot(edge23.Nodes, 2);
        var root3 = ApiHelpers.GetRoot(edge23.Nodes, 3);
        root1.Should().Be(root2);
        root2.Should().Be(root3);

        // Delete edge 1-2 → should split into {1} and {2,3}
        var nodesAfterDelete = await ApiHelpers.DeleteEdgeAsync(_client, ufType, edge12!.EdgeId);

        var newRoot1 = ApiHelpers.GetRoot(nodesAfterDelete!, 1);
        var newRoot2 = ApiHelpers.GetRoot(nodesAfterDelete!, 2);
        var newRoot3 = ApiHelpers.GetRoot(nodesAfterDelete!, 3);

        newRoot1.Should().NotBe(newRoot2);  // 1 is isolated
        newRoot2.Should().Be(newRoot3);     // 2 and 3 still connected

        await ApiHelpers.ClearDatabaseAsync(_client);
    }

    // Scenario 2: User builds a star graph (one center node connected to many leaves).
    // All nodes should end up in one component.
    [Theory]
    [InlineData("UF")]
    [InlineData("WUF")]
    [InlineData("PCUF")]
    [InlineData("WPCUF")]
    public async Task Scenario_StarGraph_AllNodesInOneComponent(string ufType)
    {
        // Build: 2,3,4,5 all connected to center node 1
        await ApiHelpers.PostEdgeAsync(_client, ufType, 1, 2);
        await ApiHelpers.PostEdgeAsync(_client, ufType, 1, 3);
        await ApiHelpers.PostEdgeAsync(_client, ufType, 1, 4);
        var lastResult = await ApiHelpers.PostEdgeAsync(_client, ufType, 1, 5);

        var nodes = lastResult!.Nodes;
        var root = ApiHelpers.GetRoot(nodes, 1);

        foreach (var node in nodes)
            ApiHelpers.GetRoot(nodes, node.Id).Should().Be(root);

        await ApiHelpers.ClearDatabaseAsync(_client);
    }

    // Scenario 3: User adds an edge between two already-connected nodes.
    // The union-find state should not change (still same components).
    [Theory]
    [InlineData("UF")]
    [InlineData("WUF")]
    [InlineData("PCUF")]
    [InlineData("WPCUF")]
    public async Task Scenario_AddEdgeBetweenAlreadyConnectedNodes_StateUnchanged(string ufType)
    {
        // Connect 1-2 via two paths: direct, and via 3
        await ApiHelpers.PostEdgeAsync(_client, ufType, 1, 2);
        await ApiHelpers.PostEdgeAsync(_client, ufType, 1, 3);
        await ApiHelpers.PostEdgeAsync(_client, ufType, 3, 2); // redundant edge

        var nodes = await ApiHelpers.GetNodesAsync(_client, ufType);

        // All three nodes still in one component despite redundant edge
        var root1 = ApiHelpers.GetRoot(nodes!, 1);
        var root2 = ApiHelpers.GetRoot(nodes!, 2);
        var root3 = ApiHelpers.GetRoot(nodes!, 3);
        root1.Should().Be(root2);
        root2.Should().Be(root3);

        await ApiHelpers.ClearDatabaseAsync(_client);
    }

    // Scenario 4: User builds two separate components, verifies they are disconnected,
    // then bridges them with a new edge and verifies they merge into one.
    [Theory]
    [InlineData("UF")]
    [InlineData("WUF")]
    [InlineData("PCUF")]
    [InlineData("WPCUF")]
    public async Task Scenario_TwoComponents_MergeWhenBridged(string ufType)
    {
        // Build two separate components: {1,2} and {3,4}
        await ApiHelpers.PostEdgeAsync(_client, ufType, 1, 2);
        await ApiHelpers.PostEdgeAsync(_client, ufType, 3, 4);

        var nodesBefore = await ApiHelpers.GetNodesAsync(_client, ufType);
        ApiHelpers.GetRoot(nodesBefore!, 1).Should().NotBe(ApiHelpers.GetRoot(nodesBefore!, 3));

        // Bridge the two components with edge 2-3
        var merged = await ApiHelpers.PostEdgeAsync(_client, ufType, 2, 3);

        var root1 = ApiHelpers.GetRoot(merged!.Nodes, 1);
        var root4 = ApiHelpers.GetRoot(merged.Nodes, 4);
        root1.Should().Be(root4); // now all four in one component

        await ApiHelpers.ClearDatabaseAsync(_client);
    }

    // Scenario 5: User clears the database mid-session and starts fresh.
    // After clearing, the graph should be completely empty.
    [Fact]
    public async Task Scenario_ClearMidSession_CanStartFresh()
    {
        // Build a graph
        await ApiHelpers.PostEdgeAsync(_client, "UF", 1, 2);
        await ApiHelpers.PostEdgeAsync(_client, "UF", 3, 4);

        // Clear and verify empty
        await ApiHelpers.ClearDatabaseAsync(_client);
        var nodesAfterClear = await ApiHelpers.GetNodesAsync(_client, "UF");
        nodesAfterClear.Should().BeEmpty();

        // Start a new fresh graph
        var freshResult = await ApiHelpers.PostEdgeAsync(_client, "UF", 10, 20);
        freshResult!.Nodes.Should().HaveCount(2);
        freshResult.Nodes.Should().Contain(n => n.Id == 10);
        freshResult.Nodes.Should().Contain(n => n.Id == 20);
    }

    // Scenario 6 (weighted only): Verifies the weighted union property — after many unions,
    // the root of the larger component should absorb the smaller one.
    [Theory]
    [InlineData("WUF")]
    [InlineData("WPCUF")]
    public async Task Scenario_WeightedUnion_LargerComponentAbsorbsSmaller(string ufType)
    {
        // Build a component of size 3: {1,2,3}
        await ApiHelpers.PostEdgeAsync(_client, ufType, 1, 2);
        await ApiHelpers.PostEdgeAsync(_client, ufType, 1, 3);

        // Now union with an isolated node 4 — the {1,2,3} root should absorb node 4
        var result = await ApiHelpers.PostEdgeAsync(_client, ufType, 1, 4);

        // Node 4 should be a child (not the root) since {1,2,3} is larger
        var node4 = result!.Nodes.First(n => n.Id == 4);
        node4.Parent.Should().NotBe(4); // node 4 is not its own root

        await ApiHelpers.ClearDatabaseAsync(_client);
    }
}
