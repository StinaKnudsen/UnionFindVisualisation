namespace Infrastructure;

public class Edge
{
    public required int Id {get; set;}
    public required Node StartNode {get; set;}
    public required Node EndNode {get; set;}
}