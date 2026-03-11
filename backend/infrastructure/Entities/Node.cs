namespace backend.infrastructure.Entities;

public class Node
{
    public required int Id {get; set;}
    public List<Edge>? Edges {get; set;}
    
    // -1 = root
    public int Parent {get; set;} = -1; 
    
}