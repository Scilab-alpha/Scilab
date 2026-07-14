import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '@/auth/application/ports/auth.ports';
import { CurrentUser } from '@/auth/interfaces/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/auth/interfaces/guards/jwt-auth.guard';
import { UserEventsService } from '@/events/application/user-events.service';
import { ListFollowsUseCase } from '@/follow/application/use-cases/list-follows/list-follows.use-case';
import { ToggleFollowUseCase } from '@/follow/application/use-cases/toggle-follow/toggle-follow.use-case';
import { UpdateFollowNotifyModeUseCase } from '@/follow/application/use-cases/update-follow-notify-mode/update-follow-notify-mode.use-case';
import {
  FollowFailureReason,
  FollowUseCaseError,
} from '@/follow/domain/follow.errors';
import {
  FollowQueryDto,
  ToggleFollowDto,
  UpdateFollowNotifyModeDto,
} from '@/follow/interfaces/http/follow.dto';
import {
  ApiListFollows,
  ApiPatchFollowNotifyMode,
  ApiToggleFollow,
} from '@/follow/interfaces/http/follow.swagger';
import { createSuccessResponse } from '@/shared/response/response.factory';

@ApiTags('Follows')
@Controller('follows')
@UseGuards(JwtAuthGuard)
export class FollowController {
  constructor(
    private readonly listFollows: ListFollowsUseCase,
    private readonly toggleFollow: ToggleFollowUseCase,
    private readonly updateNotifyMode: UpdateFollowNotifyModeUseCase,
    private readonly events: UserEventsService,
  ) {}

  @Get()
  @ApiListFollows()
  async list(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: FollowQueryDto,
  ) {
    try {
      const result = await this.listFollows.execute({
        userId: currentUser.userId,
        type: query.type,
        page: query.page,
        limit: query.limit,
      });
      return createSuccessResponse(result, 'Follows retrieved');
    } catch (error) {
      throw this.toHttpException(error);
    }
  }

  @Post('toggle')
  @HttpCode(200)
  @ApiToggleFollow()
  async toggle(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() body: ToggleFollowDto,
  ) {
    try {
      const result = await this.toggleFollow.execute({
        userId: currentUser.userId,
        objectType: body.objectType,
        objectId: body.objectId,
        notifyMode: body.notifyMode,
      });
      this.events.emit(currentUser.userId, 'follow.toggled', result);
      return createSuccessResponse(result, 'Follow toggled');
    } catch (error) {
      throw this.toHttpException(error);
    }
  }

  @Patch(':objectType/:objectId')
  @ApiPatchFollowNotifyMode()
  async patchNotifyMode(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('objectType') objectType: string,
    @Param('objectId') objectId: string,
    @Body() body: UpdateFollowNotifyModeDto,
  ) {
    try {
      const result = await this.updateNotifyMode.execute({
        userId: currentUser.userId,
        objectType,
        objectId,
        notifyMode: body.notifyMode,
      });
      this.events.emit(currentUser.userId, 'follow.updated', result);
      return createSuccessResponse(result, 'Follow notification mode updated');
    } catch (error) {
      throw this.toHttpException(error);
    }
  }

  private toHttpException(error: unknown) {
    if (error instanceof FollowUseCaseError) {
      if (error.reason === FollowFailureReason.InvalidInput) {
        return new BadRequestException(error.message);
      }

      if (
        error.reason === FollowFailureReason.TargetMissing ||
        error.reason === FollowFailureReason.FollowMissing
      ) {
        return new NotFoundException(error.message);
      }
    }

    return new InternalServerErrorException('Follow request failed');
  }
}
