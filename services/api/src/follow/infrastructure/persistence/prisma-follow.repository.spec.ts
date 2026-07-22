import { PrismaFollowRepository } from '@/follow/infrastructure/persistence/prisma-follow.repository';

describe('PrismaFollowRepository', () => {
  it('counts follows for the requested user only', async () => {
    const count = jest.fn().mockResolvedValue(4);
    const repository = new PrismaFollowRepository({
      userFollow: { count },
    } as never);

    await expect(repository.countByUser('user-1')).resolves.toBe(4);
    expect(count).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
  });
});
