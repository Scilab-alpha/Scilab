import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
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

const genderSchema = {
  type: 'string',
  enum: ['MALE', 'FEMALE', 'OTHER'],
  example: 'MALE',
};

const roleSchema = {
  type: 'string',
  enum: ['STUDENT', 'RESEARCHER', 'ADMIN'],
  example: 'STUDENT',
};

const patchableRoleSchema = {
  type: 'string',
  enum: ['STUDENT', 'RESEARCHER'],
  example: 'RESEARCHER',
};

const statusSchema = {
  type: 'string',
  enum: ['ACTIVE', 'INACTIVE', 'BANNED'],
  example: 'ACTIVE',
};

const userSchema = {
  type: 'object',
  required: [
    'id',
    'email',
    'status',
    'role',
    'firstName',
    'lastName',
    'imageUrl',
    'gender',
    'dateOfBirth',
  ],
  additionalProperties: false,
  properties: {
    id: { type: 'string', format: 'uuid' },
    email: { type: 'string', format: 'email' },
    status: statusSchema,
    role: roleSchema,
    firstName: { type: 'string', nullable: true },
    lastName: { type: 'string', nullable: true },
    imageUrl: { type: 'string', nullable: true },
    gender: { ...genderSchema, nullable: true },
    dateOfBirth: { type: 'string', format: 'date-time', nullable: true },
  },
};

const userResponseSchema = envelopeSchema(userSchema, 'User retrieved');

const userListResponseSchema = envelopeSchema(
  {
    type: 'object',
    required: ['users'],
    additionalProperties: false,
    properties: {
      users: {
        type: 'array',
        items: userSchema,
      },
    },
  },
  'Users retrieved',
);

const emptyObjectSchema = envelopeSchema(
  {
    type: 'object',
    additionalProperties: false,
    example: {},
  },
  'User deleted',
);

const patchUserBodySchema = {
  type: 'object',
  additionalProperties: false,
  minProperties: 1,
  properties: {
    email: { type: 'string', format: 'email' },
    firstname: { type: 'string', minLength: 1, maxLength: 255 },
    lastname: { type: 'string', minLength: 1, maxLength: 255 },
    gender: genderSchema,
    dateofbirth: {
      type: 'string',
      format: 'date',
      example: '2001-04-12',
    },
  },
};

const patchRoleBodySchema = {
  type: 'object',
  required: ['role'],
  additionalProperties: false,
  properties: {
    role: patchableRoleSchema,
  },
};

const patchStatusBodySchema = {
  type: 'object',
  required: ['status'],
  additionalProperties: false,
  properties: {
    status: statusSchema,
  },
};

const unauthorizedSchema = errorEnvelopeSchema('Authentication failed');
const forbiddenSchema = errorEnvelopeSchema('Admin role is required');
const badRequestSchema = errorEnvelopeSchema('User input is invalid');
const conflictSchema = errorEnvelopeSchema('Email is already used');
const notFoundSchema = errorEnvelopeSchema('User not found');

function ApiUserBearerAuth() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiUnauthorizedResponse({
      description: 'Authentication failed',
      schema: unauthorizedSchema,
    }),
  );
}

function ApiAdminAuth() {
  return applyDecorators(
    ApiUserBearerAuth(),
    ApiForbiddenResponse({
      description: 'Admin role is required',
      schema: forbiddenSchema,
    }),
  );
}

function ApiUserIdParam() {
  return ApiParam({
    name: 'userId',
    required: true,
    schema: { type: 'string', format: 'uuid' },
  });
}

function ApiUserFailureResponses() {
  return applyDecorators(
    ApiBadRequestResponse({
      description: 'User input is invalid',
      schema: badRequestSchema,
    }),
    ApiConflictResponse({
      description: 'Email is already used',
      schema: conflictSchema,
    }),
    ApiNotFoundResponse({
      description: 'User not found',
      schema: notFoundSchema,
    }),
  );
}

export function ApiGetMyUser() {
  return applyDecorators(
    ApiUserBearerAuth(),
    ApiOperation({ summary: 'Return the authenticated user profile' }),
    ApiOkResponse({
      description: 'User retrieved',
      schema: userResponseSchema,
    }),
    ApiNotFoundResponse({
      description: 'User not found',
      schema: notFoundSchema,
    }),
  );
}

export function ApiPatchMyUser() {
  return applyDecorators(
    ApiUserBearerAuth(),
    ApiOperation({ summary: 'Update the authenticated user profile' }),
    ApiBody({ schema: patchUserBodySchema }),
    ApiOkResponse({
      description: 'User updated',
      schema: {
        ...userResponseSchema,
        properties: {
          ...userResponseSchema.properties,
          message: { type: 'string', example: 'User updated' },
        },
      },
    }),
    ApiUserFailureResponses(),
  );
}

export function ApiListUsers() {
  return applyDecorators(
    ApiAdminAuth(),
    ApiOperation({ summary: 'List users for admin management' }),
    ApiOkResponse({
      description: 'Users retrieved',
      schema: userListResponseSchema,
    }),
  );
}

export function ApiGetUser() {
  return applyDecorators(
    ApiAdminAuth(),
    ApiUserIdParam(),
    ApiOperation({ summary: 'Return one user for admin management' }),
    ApiOkResponse({
      description: 'User retrieved',
      schema: userResponseSchema,
    }),
    ApiNotFoundResponse({
      description: 'User not found',
      schema: notFoundSchema,
    }),
  );
}

export function ApiPatchUser() {
  return applyDecorators(
    ApiAdminAuth(),
    ApiUserIdParam(),
    ApiOperation({ summary: 'Update one user profile for admin management' }),
    ApiBody({ schema: patchUserBodySchema }),
    ApiOkResponse({
      description: 'User updated',
      schema: {
        ...userResponseSchema,
        properties: {
          ...userResponseSchema.properties,
          message: { type: 'string', example: 'User updated' },
        },
      },
    }),
    ApiUserFailureResponses(),
  );
}

export function ApiPatchUserRole() {
  return applyDecorators(
    ApiAdminAuth(),
    ApiUserIdParam(),
    ApiOperation({ summary: 'Update one user role for admin management' }),
    ApiBody({ schema: patchRoleBodySchema }),
    ApiOkResponse({
      description: 'User role updated',
      schema: {
        ...userResponseSchema,
        properties: {
          ...userResponseSchema.properties,
          message: { type: 'string', example: 'User role updated' },
        },
      },
    }),
    ApiBadRequestResponse({
      description: 'Role is invalid',
      schema: badRequestSchema,
    }),
    ApiNotFoundResponse({
      description: 'User not found',
      schema: notFoundSchema,
    }),
  );
}

export function ApiPatchUserStatus() {
  return applyDecorators(
    ApiAdminAuth(),
    ApiUserIdParam(),
    ApiOperation({ summary: 'Update one user status for admin management' }),
    ApiBody({ schema: patchStatusBodySchema }),
    ApiOkResponse({
      description: 'User status updated',
      schema: {
        ...userResponseSchema,
        properties: {
          ...userResponseSchema.properties,
          message: { type: 'string', example: 'User status updated' },
        },
      },
    }),
    ApiBadRequestResponse({
      description: 'Status is invalid',
      schema: badRequestSchema,
    }),
    ApiNotFoundResponse({
      description: 'User not found',
      schema: notFoundSchema,
    }),
  );
}

export function ApiDeleteUser() {
  return applyDecorators(
    ApiAdminAuth(),
    ApiUserIdParam(),
    ApiOperation({ summary: 'Delete one user for admin management' }),
    ApiOkResponse({
      description: 'User deleted',
      schema: emptyObjectSchema,
    }),
    ApiNotFoundResponse({
      description: 'User not found',
      schema: notFoundSchema,
    }),
  );
}
