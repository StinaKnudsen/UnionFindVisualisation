namespace Infrastructure;

public class Node
{
    public required int Id {get; set;}
    public List<Edge>? Edges {get; set;}
    
    // Id of parent node
    public int Parent {get; set;}
    
}