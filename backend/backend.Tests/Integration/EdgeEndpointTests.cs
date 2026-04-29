using System.Net;
using System.Text.Json;
using FluentAssertions;
using Xunit;

// Tests for GET /api/edges/{id}
public class EdgeEndpointTests : IClassFixture<ApiFactory>, IAsyncLifetime
{
    private readonly HttpClient _client;

    public EdgeEndpointTests(ApiFactory factory)
    {
        _client = factory.CreateClient();
    }

    public async Task InitializeAsync() => await ApiHelpers.ClearDatabaseAsync(_client);
    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task GetEdge_ExistingEdge_Returns200WithEdgeData()
    {
        // Create an edge so we have something to retrieve
        var postResult = await ApiHelpers.PostEdgeAsync(_client, "UF", 1, 2);
        var edgeId = postResult!.EdgeId;

        var response = await _client.GetAsync($"/api/edges/{edgeId}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await response.Content.ReadAsStringAsync();
        var edge = JsonSerializer.Deserialize<EdgeResponse>(json,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        edge!.StartNodeId.Should().Be(1);
        edge.EndNodeId.Should().Be(2);
    }

    [Fact]
    public async Task GetEdge_NonExistingEdge_Returns404()
    {
        var response = await _client.GetAsync("/api/edges/99999");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
