import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

const userSchema = {
  type: 'object',
  required: [
    'id',
    'email',
    'type',
    'status',
    'role',
    'firstName',
    'lastName',
    'imageUrl',
    'dateOfBirth',
    'gender',
    'createdAt',
    'updatedAt',
  ],
  properties: {
    id: { type: 'string', format: 'uuid' },
    email: { type: 'string', format: 'email' },
    type: { type: 'string', enum: ['EMAIL', 'GOOGLE'] },
    status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'BANNED'] },
    role: { type: 'string', enum: ['STUDENT', 'RESEARCHER', 'ADMIN'] },
    firstName: { type: 'string', nullable: true },
    lastName: { type: 'string', nullable: true },
    imageUrl: { type: 'string', nullable: true },
    dateOfBirth: { type: 'string', format: 'date', nullable: true },
    gender: {
      type: 'string',
      enum: ['MALE', 'FEMALE', 'OTHER'],
      nullable: true,
    },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

const userEnvelope = (message: string) => ({
  properties: {
    success: { type: 'boolean', example: true },
    message: { type: 'string', example: message },
    data: userSchema,
  },
});

const userListEnvelope = {
  properties: {
    success: { type: 'boolean', example: true },
    message: { type: 'string', example: 'Users retrieved' },
    data: {
      type: 'object',
      required: ['users'],
      properties: {
        users: {
          type: 'array',
          items: userSchema,
        },
      },
    },
  },
};

const emptyEnvelope = {
  properties: {
    success: { type: 'boolean', example: true },
    message: { type: 'string', example: 'User deleted' },
    data: {
      type: 'object',
      additionalProperties: false,
      example: {},
    },
  },
};

const createUserBody = {
  required: ['email', 'password', 'type', 'status', 'role'],
  properties: {
    email: { type: 'string', format: 'email' },
    password: { type: 'string', minLength: 8 },
    type: { type: 'string', enum: ['EMAIL', 'GOOGLE'] },
    status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'BANNED'] },
    role: { type: 'string', enum: ['STUDENT', 'RESEARCHER', 'ADMIN'] },
    firstName: { type: 'string', nullable: true },
    lastName: { type: 'string', nullable: true },
    imageUrl: { type: 'string', nullable: true },
    dateOfBirth: { type: 'string', format: 'date', nullable: true },
    gender: {
      type: 'string',
      enum: ['MALE', 'FEMALE', 'OTHER'],
      nullable: true,
    },
  },
};

const updateUserBody = {
  properties: {
    email: { type: 'string', format: 'email' },
    firstName: { type: 'string', nullable: true },
    lastName: { type: 'string', nullable: true },
    imgUrl: { type: 'string', nullable: true },
    dateOfBirth: { type: 'string', format: 'date', nullable: true },
    gender: {
      type: 'string',
      enum: ['MALE', 'FEMALE', 'OTHER'],
      nullable: true,
    },
  },
};

const updateUserRoleBody = {
  required: ['role'],
  properties: {
    role: { type: 'string', enum: ['STUDENT', 'RESEARCHER'] },
  },
};

export function ApiCurrentUser() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Return the authenticated user' }),
    ApiOkResponse({ schema: userEnvelope('Current user retrieved') }),
    ApiUnauthorizedResponse({ description: 'Authentication failed' }),
  );
}

export function ApiListUsers() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'List users' }),
    ApiOkResponse({ schema: userListEnvelope }),
    ApiUnauthorizedResponse({ description: 'Authentication failed' }),
    ApiForbiddenResponse({ description: 'Admin role is required' }),
  );
}

export function ApiGetUser() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Get a user by id' }),
    ApiOkResponse({ schema: userEnvelope('User retrieved') }),
    ApiUnauthorizedResponse({ description: 'Authentication failed' }),
    ApiForbiddenResponse({ description: 'Admin role is required' }),
    ApiNotFoundResponse({ description: 'User was not found' }),
  );
}

export function ApiCreateUser() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Create a user' }),
    ApiBody({ schema: createUserBody }),
    ApiCreatedResponse({ schema: userEnvelope('User created') }),
    ApiUnauthorizedResponse({ description: 'Authentication failed' }),
    ApiForbiddenResponse({ description: 'Admin role is required' }),
    ApiConflictResponse({ description: 'Email is already registered' }),
  );
}

export function ApiUpdateUser() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Update a user' }),
    ApiBody({ schema: updateUserBody }),
    ApiOkResponse({ schema: userEnvelope('User updated') }),
    ApiUnauthorizedResponse({ description: 'Authentication failed' }),
    ApiForbiddenResponse({ description: 'Admin role is required' }),
    ApiConflictResponse({ description: 'Email is already registered' }),
    ApiNotFoundResponse({ description: 'User was not found' }),
  );
}

export function ApiUpdateUserRole() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Update a user role' }),
    ApiBody({ schema: updateUserRoleBody }),
    ApiOkResponse({ schema: userEnvelope('User role updated') }),
    ApiUnauthorizedResponse({ description: 'Authentication failed' }),
    ApiForbiddenResponse({ description: 'Admin role is required' }),
    ApiNotFoundResponse({ description: 'User was not found' }),
  );
}

export function ApiDeleteUser() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Delete a user' }),
    ApiOkResponse({ schema: emptyEnvelope }),
    ApiUnauthorizedResponse({ description: 'Authentication failed' }),
    ApiForbiddenResponse({ description: 'Admin role is required' }),
    ApiNotFoundResponse({ description: 'User was not found' }),
  );
}
