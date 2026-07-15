import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
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

const errorEnvelopeSchema = (message: string) =>
  envelopeSchema(
    { type: 'object', additionalProperties: false, example: {} },
    message,
    false,
  );

const platformSchema = {
  type: 'string',
  enum: ['IOS', 'ANDROID', 'WEB', 'UNKNOWN'],
};

const providerSchema = {
  type: 'string',
  enum: ['EXPO', 'FCM'],
};

const registerRequestSchema = {
  type: 'object',
  required: ['token'],
  additionalProperties: false,
  properties: {
    token: { type: 'string', maxLength: 2048 },
    platform: platformSchema,
    clientDeviceId: { type: 'string', maxLength: 255 },
  },
};

const unregisterRequestSchema = {
  type: 'object',
  required: ['token'],
  additionalProperties: false,
  properties: {
    token: { type: 'string', maxLength: 2048 },
  },
};

const registerResponseSchema = envelopeSchema(
  {
    type: 'object',
    required: [
      'deviceId',
      'provider',
      'platform',
      'isActive',
      'lastRegisteredAt',
    ],
    additionalProperties: false,
    properties: {
      deviceId: { type: 'string', format: 'uuid' },
      provider: providerSchema,
      platform: platformSchema,
      isActive: { type: 'boolean' },
      lastRegisteredAt: { type: 'string', format: 'date-time' },
    },
  },
  'Push device registered',
);

const unregisterResponseSchema = envelopeSchema(
  {
    type: 'object',
    required: ['unregistered'],
    additionalProperties: false,
    properties: {
      unregistered: { type: 'boolean' },
    },
  },
  'Push device unregistered',
);

function ApiPushBearerAuth() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiUnauthorizedResponse({
      description: 'Authentication failed',
      schema: errorEnvelopeSchema('Authentication failed'),
    }),
  );
}

export function ApiRegisterPushDevice() {
  return applyDecorators(
    ApiPushBearerAuth(),
    ApiOperation({ summary: 'Register a push notification device token' }),
    ApiBody({ schema: registerRequestSchema }),
    ApiOkResponse({
      description: 'Push device registered',
      schema: registerResponseSchema,
    }),
    ApiBadRequestResponse({
      description: 'Push input is invalid',
      schema: errorEnvelopeSchema('token is invalid'),
    }),
  );
}

export function ApiUnregisterPushDevice() {
  return applyDecorators(
    ApiPushBearerAuth(),
    ApiOperation({ summary: 'Unregister a push notification device token' }),
    ApiBody({ schema: unregisterRequestSchema }),
    ApiOkResponse({
      description: 'Push device unregistered',
      schema: unregisterResponseSchema,
    }),
    ApiBadRequestResponse({
      description: 'Push input is invalid',
      schema: errorEnvelopeSchema('token is invalid'),
    }),
  );
}
