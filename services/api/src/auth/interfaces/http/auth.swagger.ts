import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

function envelopeSchema(
  data: Record<string, unknown>,
  message: string,
  success = true,
) {
  return {
    type: 'object',
    required: ['success', 'message', 'data'],
    additionalProperties: false,
    properties: {
      success: { type: 'boolean', example: success },
      message: { type: 'string', example: message },
      data,
    },
  };
}

function errorEnvelopeSchema(message: string) {
  return envelopeSchema(
    {
      type: 'object',
      additionalProperties: false,
      example: {},
    },
    message,
    false,
  );
}

const tokenPairSchema = envelopeSchema(
  {
    type: 'object',
    required: ['accessToken', 'refreshToken'],
    additionalProperties: false,
    properties: {
      accessToken: { type: 'string' },
      refreshToken: { type: 'string' },
    },
  },
  'Authentication successful',
);

const genderSchema = {
  type: 'string',
  enum: ['MALE', 'FEMALE', 'OTHER'],
  example: 'MALE',
};

const registeredUserSchema = envelopeSchema(
  {
    type: 'object',
    required: ['id', 'email', 'status', 'role'],
    additionalProperties: false,
    properties: {
      id: { type: 'string', format: 'uuid' },
      email: { type: 'string', format: 'email' },
      status: { type: 'string', example: 'ACTIVE' },
      role: { type: 'string', example: 'STUDENT' },
      firstName: { type: 'string', nullable: true },
      lastName: { type: 'string', nullable: true },
      gender: { ...genderSchema, nullable: true },
      dateOfBirth: { type: 'string', format: 'date-time', nullable: true },
    },
  },
  'Registration successful',
);

const currentUserSchema = envelopeSchema(
  {
    type: 'object',
    required: ['id', 'email', 'status', 'role'],
    additionalProperties: false,
    properties: {
      id: { type: 'string', format: 'uuid' },
      email: { type: 'string', format: 'email' },
      status: { type: 'string', example: 'ACTIVE' },
      role: { type: 'string', example: 'STUDENT' },
      firstName: { type: 'string', nullable: true },
      lastName: { type: 'string', nullable: true },
      imageUrl: { type: 'string', nullable: true },
    },
  },
  'Current user retrieved',
);

const emptyObjectSchema = envelopeSchema(
  {
    type: 'object',
    additionalProperties: false,
    example: {},
  },
  'Logout successful',
);

const badRequestSchema = errorEnvelopeSchema('Registration input is invalid');
const conflictSchema = errorEnvelopeSchema('Email is already registered');
const forbiddenSchema = errorEnvelopeSchema(
  'Account is not allowed to sign in',
);
const unauthorizedSchema = errorEnvelopeSchema('Authentication failed');

const loginBodySchema = {
  type: 'object',
  required: ['email', 'password'],
  additionalProperties: false,
  properties: {
    email: { type: 'string', format: 'email' },
    password: { type: 'string', minLength: 1 },
  },
};

const registerBodySchema = {
  type: 'object',
  required: [
    'email',
    'password',
    'firstname',
    'lastname',
    'gender',
    'dataofbirth',
  ],
  additionalProperties: false,
  properties: {
    email: { type: 'string', format: 'email' },
    password: { type: 'string', minLength: 8 },
    firstname: { type: 'string' },
    lastname: { type: 'string' },
    gender: genderSchema,
    dataofbirth: {
      type: 'string',
      format: 'date',
      example: '2001-04-12',
    },
  },
};

const refreshBodySchema = {
  type: 'object',
  required: ['refreshToken'],
  additionalProperties: false,
  properties: {
    refreshToken: { type: 'string' },
  },
};

export function ApiRegister() {
  return applyDecorators(
    ApiOperation({ summary: 'Register a student account' }),
    ApiBody({
      schema: registerBodySchema,
    }),
    ApiCreatedResponse({ schema: registeredUserSchema }),
    ApiBadRequestResponse({
      description: 'Registration input is invalid',
      schema: badRequestSchema,
    }),
    ApiConflictResponse({
      description: 'Email is already registered',
      schema: conflictSchema,
    }),
  );
}

export function ApiLogin() {
  return applyDecorators(
    ApiOperation({ summary: 'Sign in with credentials' }),
    ApiBody({
      schema: loginBodySchema,
    }),
    ApiOkResponse({
      description: 'Authentication successful',
      schema: tokenPairSchema,
    }),
    ApiBadRequestResponse({
      description: 'Email and password are required',
      schema: errorEnvelopeSchema('Email and password are required'),
    }),
    ApiUnauthorizedResponse({
      description: 'Authentication failed',
      schema: unauthorizedSchema,
    }),
    ApiForbiddenResponse({
      description: 'Account is not allowed to sign in',
      schema: forbiddenSchema,
    }),
  );
}

export function ApiRefresh() {
  return applyDecorators(
    ApiOperation({ summary: 'Refresh access and refresh tokens' }),
    ApiBody({
      schema: refreshBodySchema,
    }),
    ApiOkResponse({
      description: 'Authentication refreshed',
      schema: {
        ...tokenPairSchema,
        properties: {
          ...tokenPairSchema.properties,
          message: { type: 'string', example: 'Authentication refreshed' },
        },
      },
    }),
    ApiBadRequestResponse({
      description: 'Refresh token is required',
      schema: errorEnvelopeSchema('Refresh token is required'),
    }),
    ApiUnauthorizedResponse({
      description: 'Authentication failed',
      schema: unauthorizedSchema,
    }),
  );
}

export function ApiCurrentUser() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Return the authenticated user' }),
    ApiOkResponse({
      description: 'Current user retrieved',
      schema: currentUserSchema,
    }),
    ApiUnauthorizedResponse({
      description: 'Authentication failed',
      schema: unauthorizedSchema,
    }),
  );
}

export function ApiLogout() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Revoke the current authenticated session' }),
    ApiOkResponse({
      description: 'Logout successful',
      schema: emptyObjectSchema,
    }),
    ApiUnauthorizedResponse({
      description: 'Authentication failed',
      schema: unauthorizedSchema,
    }),
  );
}
