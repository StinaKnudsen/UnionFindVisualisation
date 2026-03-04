namespace backend.infrastructure.Entities;

public class Tree
{
    public required int Id {get; set;}
    public List<Node> Nodes {get; set;} = new();
    public int size {get; set;}
}