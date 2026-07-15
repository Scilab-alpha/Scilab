import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  InternalServerErrorException,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '@/auth/application/ports/auth.ports';
import { CurrentUser } from '@/auth/interfaces/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/auth/interfaces/guards/jwt-auth.guard';
import { RegisterPushDeviceUseCase } from '@/push/application/use-cases/register-push-device/register-push-device.use-case';
import { UnregisterPushDeviceUseCase } from '@/push/application/use-cases/unregister-push-device/unregister-push-device.use-case';
import { PushFailureReason, PushUseCaseError } from '@/push/domain/push.errors';
import {
  RegisterPushDeviceDto,
  UnregisterPushDeviceDto,
} from '@/push/interfaces/http/push-device.dto';
import {
  ApiRegisterPushDevice,
  ApiUnregisterPushDevice,
} from '@/push/interfaces/http/push-device.swagger';
import { createSuccessResponse } from '@/shared/response/response.factory';

@ApiTags('Push')
@Controller('push/devices')
@UseGuards(JwtAuthGuard)
export class PushDeviceController {
  constructor(
    private readonly registerPushDevice: RegisterPushDeviceUseCase,
    private readonly unregisterPushDevice: UnregisterPushDeviceUseCase,
  ) {}

  @Post('register')
  @HttpCode(200)
  @ApiRegisterPushDevice()
  async register(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() body: RegisterPushDeviceDto,
  ) {
    try {
      const result = await this.registerPushDevice.execute({
        userId: currentUser.userId,
        token: body.token,
        platform: body.platform,
        clientDeviceId: body.clientDeviceId,
      });
      return createSuccessResponse(result, 'Push device registered');
    } catch (error) {
      throw this.toHttpException(error);
    }
  }

  @Post('unregister')
  @HttpCode(200)
  @ApiUnregisterPushDevice()
  async unregister(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() body: UnregisterPushDeviceDto,
  ) {
    try {
      const result = await this.unregisterPushDevice.execute({
        userId: currentUser.userId,
        token: body.token,
      });
      return createSuccessResponse(result, 'Push device unregistered');
    } catch (error) {
      throw this.toHttpException(error);
    }
  }

  private toHttpException(error: unknown) {
    if (
      error instanceof PushUseCaseError &&
      error.reason === PushFailureReason.InvalidInput
    ) {
      return new BadRequestException(error.message);
    }

    return new InternalServerErrorException('Push request failed');
  }
}
