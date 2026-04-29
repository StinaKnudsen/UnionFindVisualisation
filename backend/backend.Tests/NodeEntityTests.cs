using backend.infrastructure.Entities;
using FluentAssertions;
using Xunit;

public class NodeEntityTests
{
    [Fact]
    public void Node_EdgesProperty_CanBeSetAndRead()
    {
        var edge = new Edge { StartNodeId = 1, EndNodeId = 2 };
        var node = new Node { Id = 1, Parent = 1, Edges = [edge] };

        node.Edges.Should().ContainSingle()
            .Which.StartNodeId.Should().Be(1);
    }

    [Fact]
    public void Node_EdgesProperty_IsNullByDefault()
    {
        var node = new Node { Id = 1, Parent = 1 };

        node.Edges.Should().BeNull();
    }
}
