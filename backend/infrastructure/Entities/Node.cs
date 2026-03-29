using System.ComponentModel.DataAnnotations.Schema;

namespace backend.infrastructure.Entities;

public class Node
{
    [DatabaseGenerated(DatabaseGeneratedOption.None)]
    public required int Id {get; set;}
    public List<Edge>? Edges {get; set;}
    
    // -1 = root
    public int Parent {get; set;} = -1; 
    
    // used by root nodes to track size of tree
    public int Size { get; set; } = 1;
}