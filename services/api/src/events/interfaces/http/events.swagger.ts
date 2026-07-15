import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

const eventPayloadSchema = {
  type: 'object',
  required: ['eventId', 'occurredAt', 'type', 'data'],
  additionalProperties: false,
  properties: {
    eventId: { type: 'string', format: 'uuid' },
    occurredAt: { type: 'string', format: 'date-time' },
    type: {
      type: 'string',
      enum: [
        'notification.created',
        'notification.read',
        'notification.read_all',
        'bookmark.toggled',
        'follow.toggled',
        'follow.updated',
        'ping',
      ],
    },
    data: { type: 'object', additionalProperties: true },
  },
};

const errorEnvelopeSchema = {
  type: 'object',
  required: ['success', 'message', 'data'],
  additionalProperties: false,
  properties: {
    success: { type: 'boolean', example: false },
    message: { type: 'string', example: 'Authentication failed' },
    data: { type: 'object', additionalProperties: false, example: {} },
  },
};

export function ApiEventStream() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Subscribe to current user realtime events with SSE',
    }),
    ApiProduces('text/event-stream'),
    ApiOkResponse({
      description: 'User event stream opened.',
      content: {
        'text/event-stream': {
          schema: eventPayloadSchema,
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'Authentication failed',
      schema: errorEnvelopeSchema,
    }),
  );
}
