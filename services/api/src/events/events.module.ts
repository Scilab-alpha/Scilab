import { Module } from '@nestjs/common';
import { AuthModule } from '@/auth/auth.module';
import { UserEventsService } from '@/events/application/user-events.service';
import { EventsController } from '@/events/interfaces/http/events.controller';

@Module({
  imports: [AuthModule],
  controllers: [EventsController],
  providers: [UserEventsService],
  exports: [UserEventsService],
})
export class EventsModule {}
