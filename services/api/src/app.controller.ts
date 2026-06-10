import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from '@/app.service';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({ summary: 'Check API availability' })
  @ApiOkResponse({
    description: 'The API is running.',
    type: String,
  })
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
