// DTOs that mirror what the API returns, used for deserializing JSON responses in tests.

public record NodeResponse(int Id, int Parent);

public record PostEdgeResponse(int EdgeId, List<NodeResponse> Nodes);

public record EdgeResponse(int Id, int StartNodeId, int EndNodeId);
