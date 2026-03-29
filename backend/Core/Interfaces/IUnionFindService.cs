public interface IUnionFindService
{
    Task<bool> UnionAsync(int nodeAId, int nodeBId);
    Task<int> FindAsync(int nodeId);
    Task RebuildAsync();
}