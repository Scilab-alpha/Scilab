export interface ApiResponse<TData = unknown> {
  success: boolean;
  message: string;
  data: TData | null;
}

export type EmptyResponseData = Record<string, never>;
