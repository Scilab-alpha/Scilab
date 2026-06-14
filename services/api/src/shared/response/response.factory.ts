import {
  ApiResponse,
  EmptyResponseData,
} from '@/shared/response/api-response.type';

export function createSuccessResponse<TData>(
  data: TData,
  message = 'OK',
): ApiResponse<TData> {
  return {
    success: true,
    message,
    data,
  };
}

export function createErrorResponse<TData = EmptyResponseData>(
  message = 'Request failed',
  data = {} as TData,
): ApiResponse<TData> {
  return {
    success: false,
    message,
    data,
  };
}

export function isApiResponse(value: unknown): value is ApiResponse {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<ApiResponse>;
  return (
    typeof candidate.success === 'boolean' &&
    typeof candidate.message === 'string' &&
    'data' in candidate
  );
}
