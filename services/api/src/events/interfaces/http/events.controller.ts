import { Controller, Sse, UseGuards, MessageEvent } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import type { AuthenticatedUser } from '@/auth/application/ports/auth.ports';
import { CurrentUser } from '@/auth/interfaces/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/auth/interfaces/guards/jwt-auth.guard';
import { UserEventsService } from '@/events/application/user-events.service';
import { ApiEventStream } from '@/events/interfaces/http/events.swagger';
import { SkipResponseEnvelope } from '@/shared/response/skip-response-envelope.decorator';

@ApiTags('Events')
@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(private readonly events: UserEventsService) {}

  @Sse()
  @SkipResponseEnvelope()
  @ApiEventStream()
  stream(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Observable<MessageEvent> {
    return this.events.subscribe(currentUser.userId);
  }
}
