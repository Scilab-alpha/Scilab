import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { OpenAlexPageBudget } from '@repo/academic/application/ports/openalex-page-budget.port';
import { ACADEMIC_PIPELINE_QUEUES } from '@repo/academic-queue';

const CONSUME_PAGE_BUDGET_LUA = `
local current = redis.call('GET', KEYS[1])
if current and tonumber(current) >= tonumber(ARGV[1]) then return 0 end
local next = redis.call('INCR', KEYS[1])
if next == 1 then redis.call('EXPIRE', KEYS[1], tonumber(ARGV[2])) end
return 1
`;

@Injectable()
export class BullMqOpenAlexPageBudget implements OpenAlexPageBudget {
  constructor(
    @InjectQueue(ACADEMIC_PIPELINE_QUEUES.journalArticleSync)
    private readonly queue: Queue,
  ) {}

  async tryConsume(limit: number, now = new Date()): Promise<boolean> {
    const client = (await this.queue.client) as unknown as {
      eval(...args: unknown[]): Promise<unknown>;
    };
    const result = await client.eval(
      CONSUME_PAGE_BUDGET_LUA,
      1,
      this.keyFor(now),
      String(limit),
      '172800',
    );
    return Number(result) === 1;
  }

  private keyFor(value: Date): string {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(value);
    const get = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((part) => part.type === type)?.value;
    return `academic:openalex:journal-page-budget:${get('year')}-${get('month')}-${get('day')}`;
  }
}
