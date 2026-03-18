namespace backend.infrastructure.Entities;

public class Edge
{
    public int Id {get; set;}
    public required int StartNodeId {get; set;}
    public required int EndNodeId {get; set;}
}