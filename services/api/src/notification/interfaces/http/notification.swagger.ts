import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
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

const errorEnvelopeSchema = (message: string) =>
  envelopeSchema(
    { type: 'object', additionalProperties: false, example: {} },
    message,
    false,
  );

const notificationSchema = {
  type: 'object',
  required: [
    'notificationId',
    'title',
    'message',
    'relatedObjectType',
    'relatedObjectId',
    'isRead',
    'createdAt',
    'readAt',
  ],
  additionalProperties: false,
  properties: {
    notificationId: { type: 'string', format: 'uuid' },
    title: { type: 'string' },
    message: { type: 'string' },
    relatedObjectType: {
      type: 'string',
      enum: ['ARTICLE', 'JOURNAL', 'KEYWORD', 'TOPIC'],
      nullable: true,
    },
    relatedObjectId: { type: 'string', format: 'uuid', nullable: true },
    isRead: { type: 'boolean' },
    createdAt: { type: 'string', format: 'date-time' },
    readAt: { type: 'string', format: 'date-time', nullable: true },
  },
};

const listSchema = envelopeSchema(
  {
    type: 'object',
    required: ['items', 'page', 'limit', 'hasMore'],
    additionalProperties: false,
    properties: {
      items: { type: 'array', items: notificationSchema },
      page: { type: 'integer', example: 1 },
      limit: { type: 'integer', example: 20 },
      hasMore: { type: 'boolean', example: false },
    },
  },
  'Notifications retrieved',
);

const unreadCountSchema = envelopeSchema(
  {
    type: 'object',
    required: ['unreadCount'],
    additionalProperties: false,
    properties: {
      unreadCount: { type: 'integer', example: 3 },
    },
  },
  'Unread notification count retrieved',
);

const readAllSchema = envelopeSchema(
  {
    type: 'object',
    required: ['updatedCount'],
    additionalProperties: false,
    properties: {
      updatedCount: { type: 'integer', example: 3 },
    },
  },
  'Notifications marked as read',
);

const unauthorizedSchema = errorEnvelopeSchema('Authentication failed');
const badRequestSchema = errorEnvelopeSchema('Notification input is invalid');
const notFoundSchema = errorEnvelopeSchema('Notification not found');

function ApiNotificationBearerAuth() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiUnauthorizedResponse({
      description: 'Authentication failed',
      schema: unauthorizedSchema,
    }),
  );
}

export function ApiListNotifications() {
  return applyDecorators(
    ApiNotificationBearerAuth(),
    ApiOperation({ summary: 'List current user notifications' }),
    ApiQuery({
      name: 'page',
      required: false,
      schema: { type: 'integer', minimum: 1, default: 1 },
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
    }),
    ApiQuery({ name: 'isRead', required: false, schema: { type: 'boolean' } }),
    ApiOkResponse({
      description: 'Notifications retrieved',
      schema: listSchema,
    }),
    ApiBadRequestResponse({
      description: 'Notification input is invalid',
      schema: badRequestSchema,
    }),
  );
}

export function ApiUnreadNotificationCount() {
  return applyDecorators(
    ApiNotificationBearerAuth(),
    ApiOperation({ summary: 'Return current user unread notification count' }),
    ApiOkResponse({
      description: 'Unread notification count retrieved',
      schema: unreadCountSchema,
    }),
  );
}

export function ApiMarkNotificationRead() {
  return applyDecorators(
    ApiNotificationBearerAuth(),
    ApiOperation({ summary: 'Mark one notification as read' }),
    ApiParam({
      name: 'notificationId',
      schema: { type: 'string', format: 'uuid' },
    }),
    ApiOkResponse({
      description: 'Notification marked as read',
      schema: envelopeSchema(notificationSchema, 'Notification marked as read'),
    }),
    ApiBadRequestResponse({
      description: 'Notification input is invalid',
      schema: badRequestSchema,
    }),
    ApiNotFoundResponse({
      description: 'Notification not found',
      schema: notFoundSchema,
    }),
  );
}

export function ApiMarkAllNotificationsRead() {
  return applyDecorators(
    ApiNotificationBearerAuth(),
    ApiOperation({ summary: 'Mark all current user notifications as read' }),
    ApiOkResponse({
      description: 'Notifications marked as read',
      schema: readAllSchema,
    }),
  );
}
