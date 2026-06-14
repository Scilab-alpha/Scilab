import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { HttpExceptionFilter } from '@/shared/response/http-exception.filter';

describe('HttpExceptionFilter', () => {
  it('converts HTTP exceptions to the shared failure envelope', () => {
    const status = jest.fn().mockReturnThis();
    const json = jest.fn();
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status, json }),
      }),
    } as unknown as ArgumentsHost;

    new HttpExceptionFilter().catch(
      new HttpException('Authentication failed', HttpStatus.UNAUTHORIZED),
      host,
    );

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({
      success: false,
      message: 'Authentication failed',
      data: {},
    });
  });
});
