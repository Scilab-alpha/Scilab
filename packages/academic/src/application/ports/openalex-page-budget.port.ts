export const OPENALEX_PAGE_BUDGET = Symbol('OPENALEX_PAGE_BUDGET');

export interface OpenAlexPageBudget {
  tryConsume(limit: number, now?: Date): Promise<boolean>;
}
