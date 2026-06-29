export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};
