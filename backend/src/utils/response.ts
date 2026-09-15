import type {
  ApiErrorResponse,
  ApiSuccessResponse
} from "../types/common.js";

export function success<T>(
  data: T
): ApiSuccessResponse<T> {
  return {
    success: true,
    data
  };
}

export function failure(
  code: string,
  message: string,
  details?: unknown
): ApiErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined
        ? { details }
        : {})
    }
  };
}