import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import {
  createSuccessResponse,
  isApiResponse,
} from '@/shared/response/response.factory';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(
      map((value: unknown) => {
        if (isApiResponse(value)) {
          return value;
        }

        return createSuccessResponse(value ?? null);
      }),
    );
  }
}
