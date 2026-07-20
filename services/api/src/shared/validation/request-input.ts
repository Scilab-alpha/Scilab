export interface PaginationInput {
  page?: unknown;
  limit?: unknown;
}

export interface Pagination {
  page: number;
  limit: number;
  skip: number;
  take: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export function parsePagination(input: PaginationInput): Pagination {
  const page = parsePositiveInteger(input.page, DEFAULT_PAGE, 'page');
  const limit = parsePositiveInteger(input.limit, DEFAULT_LIMIT, 'limit');

  if (limit > MAX_LIMIT) {
    throw new Error('limit is invalid');
  }

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    take: limit + 1,
  };
}
export function parseOptionalBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (value === true || value === 'true') {
    return true;
  }

  if (value === false || value === 'false') {
    return false;
  }

  throw new Error('isRead is invalid');
}

export function parseEnum<TValue extends string>(
  value: unknown,
  values: readonly TValue[],
  field: string,
): TValue {
  if (typeof value !== 'string') {
    throw new Error(`${field} is invalid`);
  }

  const normalized = value.trim().toUpperCase();
  if (!values.includes(normalized as TValue)) {
    throw new Error(`${field} is invalid`);
  }

  return normalized as TValue;
}

export function parseOptionalEnum<TValue extends string>(
  value: unknown,
  values: readonly TValue[],
  field: string,
): TValue | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  return parseEnum(value, values, field);
}

function parsePositiveInteger(
  value: unknown,
  fallback: number,
  field: string,
): number {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${field} is invalid`);
  }

  return parsed;
}
