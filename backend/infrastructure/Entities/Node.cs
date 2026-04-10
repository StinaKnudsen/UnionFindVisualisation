using System.ComponentModel.DataAnnotations.Schema;

namespace backend.infrastructure.Entities;

public class Node
{
    [DatabaseGenerated(DatabaseGeneratedOption.None)]
    public required int Id {get; set;}
    public List<Edge>? Edges {get; set;}
    
    // parent should be set to itself upon initialization
    public int Parent {get; set;} 
    
    // used by root nodes to track size of tree
    public int Size { get; set; } = 1;
}