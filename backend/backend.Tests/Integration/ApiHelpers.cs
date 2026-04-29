using System.Net.Http.Json;
using System.Text.Json;

// Shared helpers for making typed API calls in tests.
public static class ApiHelpers
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public static async Task<PostEdgeResponse?> PostEdgeAsync(
        HttpClient client, string ufType, int startNodeId, int endNodeId)
    {
        var response = await client.PostAsJsonAsync(
            $"/api/{ufType}/edges",
            new { StartNodeId = startNodeId, EndNodeId = endNodeId });

        response.EnsureSuccessStatusCode();
        var json = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<PostEdgeResponse>(json, JsonOptions);
    }

    public static async Task<List<NodeResponse>?> DeleteEdgeAsync(
        HttpClient client, string ufType, int edgeId)
    {
        var response = await client.DeleteAsync($"/api/{ufType}/edges/{edgeId}");
        response.EnsureSuccessStatusCode();
        var json = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<List<NodeResponse>>(json, JsonOptions);
    }

    public static async Task<List<NodeResponse>?> GetNodesAsync(
        HttpClient client, string ufType)
    {
        var response = await client.GetAsync($"/api/{ufType}/nodes");
        response.EnsureSuccessStatusCode();
        var json = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<List<NodeResponse>>(json, JsonOptions);
    }

    public static async Task ClearDatabaseAsync(HttpClient client)
    {
        var response = await client.DeleteAsync("/api/UF/database/clear");
        response.EnsureSuccessStatusCode();
    }

    // Finds the root of a node by following parent pointers
    public static int GetRoot(List<NodeResponse> nodes, int nodeId)
    {
        var map = nodes.ToDictionary(n => n.Id);
        int current = nodeId;
        while (map[current].Parent != current)
            current = map[current].Parent;
        return current;
    }
}
