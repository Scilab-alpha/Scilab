import { PrismaBookmarkRepository } from '@/bookmark/infrastructure/persistence/prisma-bookmark.repository';

describe('PrismaBookmarkRepository', () => {
  it('counts bookmarks for the requested user only', async () => {
    const count = jest.fn().mockResolvedValue(4);
    const repository = new PrismaBookmarkRepository({
      userBookmark: { count },
    } as never);

    await expect(repository.countByUser('user-1')).resolves.toBe(4);
    expect(count).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
  });
});
