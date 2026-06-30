import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiForbiddenResponse,
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

const emptyRegistrationSchema = {
  properties: {
    success: { type: 'boolean', example: true },
    message: { type: 'string', example: 'Registration successful' },
    data: {
      type: 'object',
      additionalProperties: false,
      example: {},
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

export function ApiRegister() {
  return applyDecorators(
    ApiOperation({ summary: 'Register a student account' }),
    ApiBody({
      schema: {
        required: [
          'email',
          'password',
          'firstName',
          'lastName',
          'dateOfBirth',
          'gender',
        ],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          firstName: { type: 'string', minLength: 1 },
          lastName: { type: 'string', minLength: 1 },
          dateOfBirth: { type: 'string', format: 'date' },
          gender: { type: 'string', enum: ['MALE', 'FEMALE', 'OTHER'] },
        },
      },
    }),
    ApiCreatedResponse({ schema: emptyRegistrationSchema }),
    ApiConflictResponse({ description: 'Email is already registered' }),
    ApiForbiddenResponse({ description: 'Admin account cannot be registered' }),
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
