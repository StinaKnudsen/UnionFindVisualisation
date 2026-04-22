public interface IUnionFindService
{
    Task<bool> UnionAsync(int nodeAId, int nodeBId);
    Task RebuildAsync();
}