import type { ApiErrorBody, ApiErrorCode } from './types';

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly fields?: Record<string, string>;

  constructor(
    code: ApiErrorCode,
    message: string,
    status: number,
    fields?: Record<string, string>,
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.fields = fields;
  }

  toBody(): ApiErrorBody {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.fields ? { fields: this.fields } : {}),
      },
    };
  }
}

export function conflict(message: string): ApiError {
  return new ApiError('CONFLICT', message, 409);
}

export function notFound(message = '文章不存在'): ApiError {
  return new ApiError('NOT_FOUND', message, 404);
}

export function validation(
  message: string,
  fields?: Record<string, string>,
): ApiError {
  return new ApiError('VALIDATION', message, 422, fields);
}
