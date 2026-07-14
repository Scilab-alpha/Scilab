import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  InternalServerErrorException,
  NotFoundException,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '@/auth/application/ports/auth.ports';
import { CurrentUser } from '@/auth/interfaces/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/auth/interfaces/guards/jwt-auth.guard';
import { ListBookmarksUseCase } from '@/bookmark/application/use-cases/list-bookmarks/list-bookmarks.use-case';
import { ToggleBookmarkUseCase } from '@/bookmark/application/use-cases/toggle-bookmark/toggle-bookmark.use-case';
import {
  BookmarkFailureReason,
  BookmarkUseCaseError,
} from '@/bookmark/domain/bookmark.errors';
import {
  BookmarkQueryDto,
  ToggleBookmarkDto,
} from '@/bookmark/interfaces/http/bookmark.dto';
import {
  ApiListBookmarks,
  ApiToggleBookmark,
} from '@/bookmark/interfaces/http/bookmark.swagger';
import { UserEventsService } from '@/events/application/user-events.service';
import { createSuccessResponse } from '@/shared/response/response.factory';

@ApiTags('Bookmarks')
@Controller('bookmarks')
@UseGuards(JwtAuthGuard)
export class BookmarkController {
  constructor(
    private readonly listBookmarks: ListBookmarksUseCase,
    private readonly toggleBookmark: ToggleBookmarkUseCase,
    private readonly events: UserEventsService,
  ) {}

  @Get()
  @ApiListBookmarks()
  async list(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: BookmarkQueryDto,
  ) {
    try {
      const result = await this.listBookmarks.execute({
        userId: currentUser.userId,
        page: query.page,
        limit: query.limit,
      });
      return createSuccessResponse(result, 'Bookmarks retrieved');
    } catch (error) {
      throw this.toHttpException(error);
    }
  }

  @Post('toggle')
  @HttpCode(200)
  @ApiToggleBookmark()
  async toggle(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() body: ToggleBookmarkDto,
  ) {
    try {
      const result = await this.toggleBookmark.execute({
        userId: currentUser.userId,
        articleId: body.articleId,
      });
      this.events.emit(currentUser.userId, 'bookmark.toggled', result);
      return createSuccessResponse(result, 'Bookmark toggled');
    } catch (error) {
      throw this.toHttpException(error);
    }
  }

  private toHttpException(error: unknown) {
    if (error instanceof BookmarkUseCaseError) {
      if (error.reason === BookmarkFailureReason.InvalidInput) {
        return new BadRequestException(error.message);
      }

      if (error.reason === BookmarkFailureReason.ArticleMissing) {
        return new NotFoundException(error.message);
      }
    }

    return new InternalServerErrorException('Bookmark request failed');
  }
}
