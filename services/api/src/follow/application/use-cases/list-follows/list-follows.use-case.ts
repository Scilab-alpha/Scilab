import { toFollowTargetOutput } from '@/academic/application/academic-graph.mapper';
import { AcademicGraphRepository } from '@/academic/application/ports/academic-graph.port';
import { FollowRepository } from '@/follow/application/ports/follow.ports';
import { parseOptionalFollowObjectType } from '@/follow/application/use-cases/follow-input';
import {
  ListFollowsInput,
  ListFollowsOutput,
} from '@/follow/application/use-cases/list-follows/list-follows.dto';
import {
  FollowFailureReason,
  FollowUseCaseError,
} from '@/follow/domain/follow.errors';
import { parsePagination } from '@/shared/validation/request-input';

export class ListFollowsUseCase {
  constructor(
    private readonly follows: FollowRepository,
    private readonly graph: AcademicGraphRepository,
  ) {}

  async execute(input: ListFollowsInput): Promise<ListFollowsOutput> {
    const pagination = this.parsePagination(input);
    const objectType = parseOptionalFollowObjectType(input.type);
    const records = await this.follows.listByUser({
      userId: input.userId,
      objectType,
      skip: pagination.skip,
      take: pagination.take,
    });
    const pageRecords = records.slice(0, pagination.limit);
    const targets = await this.graph.findFollowTargetsByReferences(
      pageRecords.map((record) => ({
        type: record.objectType,
        id: record.objectId,
      })),
    );
    const targetsByKey = new Map(
      targets.map((target) => [`${target.type}:${target.id}`, target] as const),
    );

    return {
      items: pageRecords.flatMap((record) => {
        const target = targetsByKey.get(
          `${record.objectType}:${record.objectId}`,
        );
        return target
          ? [
              {
                followId: record.id,
                objectType: record.objectType,
                objectId: record.objectId,
                notifyMode: record.notifyMode,
                followedAt: record.createdAt,
                target: toFollowTargetOutput(target),
              },
            ]
          : [];
      }),
      page: pagination.page,
      limit: pagination.limit,
      hasMore: records.length > pagination.limit,
    };
  }

  private parsePagination(input: ListFollowsInput) {
    try {
      return parsePagination(input);
    } catch {
      throw new FollowUseCaseError(
        FollowFailureReason.InvalidInput,
        'Pagination input is invalid',
      );
    }
  }
}
