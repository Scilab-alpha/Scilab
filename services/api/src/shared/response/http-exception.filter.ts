import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { createErrorResponse } from '@/shared/response/response.factory';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    response
      .status(status)
      .json(createErrorResponse(this.getMessage(exception)));
  }

  private getMessage(exception: unknown): string {
    if (!(exception instanceof HttpException)) {
      return 'Internal server error';
    }

    const payload = exception.getResponse();
    if (typeof payload === 'string') {
      return payload;
    }

    if (payload && typeof payload === 'object' && 'message' in payload) {
      const message = payload.message;
      if (Array.isArray(message)) {
        const firstString = message.find(
          (item): item is string => typeof item === 'string',
        );
        return firstString ?? 'Request failed';
      }

      if (typeof message === 'string') {
        return message;
      }
    }

    return exception.message || 'Request failed';
  }
}
