export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type ApiRequestOptions = Omit<RequestInit, "body"> & {
  /** Attach Bearer token when true. */
  authenticated?: boolean;
  body?: unknown;
  path: string;
};
