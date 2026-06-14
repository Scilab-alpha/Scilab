import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

const tokenPairSchema = {
  properties: {
    success: { type: 'boolean', example: true },
    message: { type: 'string', example: 'Authentication successful' },
    data: {
      type: 'object',
      required: ['accessToken', 'refreshToken'],
      additionalProperties: false,
      properties: {
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
      },
    },
  },
};

export function ApiLogin() {
  return applyDecorators(
    ApiOperation({ summary: 'Sign in with credentials' }),
    ApiBody({
      schema: {
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 1 },
        },
      },
    }),
    ApiOkResponse({ schema: tokenPairSchema }),
    ApiUnauthorizedResponse({ description: 'Authentication failed' }),
  );
}

export function ApiRefresh() {
  return applyDecorators(
    ApiOperation({ summary: 'Refresh access and refresh tokens' }),
    ApiBody({
      schema: {
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string' },
        },
      },
    }),
    ApiOkResponse({ schema: tokenPairSchema }),
    ApiUnauthorizedResponse({ description: 'Authentication failed' }),
  );
}

export function ApiProtected(summary: string) {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary }),
    ApiUnauthorizedResponse({ description: 'Authentication failed' }),
  );
}
