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
import { SKIP_RESPONSE_ENVELOPE } from '@/shared/response/skip-response-envelope.decorator';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (Reflect.getMetadata(SKIP_RESPONSE_ENVELOPE, context.getHandler())) {
      return next.handle();
    }

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
