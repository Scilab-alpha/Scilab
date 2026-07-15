export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type ApiErrorContext = "general" | "login" | "register";

export function getUserFriendlyApiErrorMessage(
  error: unknown,
  context: ApiErrorContext = "general",
): string {
  if (!(error instanceof ApiError)) {
    return "Something went wrong. Please try again.";
  }

  if (error.code === "TIMEOUT") {
    return "The request took too long. Please try again.";
  }

  if (error.code === "NETWORK_ERROR") {
    return "Unable to connect to the server. Please check that the API is running.";
  }

  if (context === "login" && error.status === 401) {
    return "The email or password you entered is incorrect.";
  }

  if (context === "register" && error.status === 409) {
    return "An account with this email already exists.";
  }

  if (error.status === 404) {
    return "The requested resource was not found.";
  }

  return (
    error.message || "We couldn't complete your request. Please try again."
  );
}
