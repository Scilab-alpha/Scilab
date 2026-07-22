import {
  Controller,
  Get,
  InternalServerErrorException,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '@/auth/application/ports/auth.ports';
import { CurrentUser } from '@/auth/interfaces/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/auth/interfaces/guards/jwt-auth.guard';
import {
  DashboardDataUnavailableError,
  GetDashboardUseCase,
} from '@/dashboard/application/use-cases/get-dashboard/get-dashboard.use-case';
import { ApiGetDashboard } from '@/dashboard/interfaces/http/dashboard.swagger';
import { createSuccessResponse } from '@/shared/response/response.factory';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly getDashboard: GetDashboardUseCase) {}

  @Get('me')
  @ApiGetDashboard()
  async getCurrentUserDashboard(@CurrentUser() currentUser: AuthenticatedUser) {
    try {
      const result = await this.getDashboard.execute({
        userId: currentUser.userId,
      });
      return createSuccessResponse(result, 'Dashboard retrieved');
    } catch (error) {
      if (error instanceof DashboardDataUnavailableError) {
        throw new ServiceUnavailableException('Dashboard data is unavailable');
      }
      throw new InternalServerErrorException('Dashboard request failed');
    }
  }
}
