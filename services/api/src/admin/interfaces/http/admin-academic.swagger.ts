import { applyDecorators } from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

const envelope = (data: Record<string, unknown>, message: string) => ({
  type: 'object',
  required: ['success', 'message', 'data'],
  properties: {
    success: { type: 'boolean', example: true },
    message: { type: 'string', example: message },
    data,
  },
});

const errors = () => [
  ApiBearerAuth(),
  ApiUnauthorizedResponse({ description: 'Authentication is required.' }),
  ApiForbiddenResponse({ description: 'Admin role is required.' }),
  ApiBadRequestResponse({ description: 'Request validation failed.' }),
  ApiNotFoundResponse({ description: 'Requested resource was not found.' }),
  ApiConflictResponse({ description: 'Job state transition is invalid.' }),
  ApiServiceUnavailableResponse({
    description: 'Queue or audit storage is unavailable.',
  }),
];

export function ApiAdminRead(summary: string, message: string) {
  return applyDecorators(
    ApiOperation({ summary }),
    ApiOkResponse({ schema: envelope({ type: 'object' }, message) }),
    ...errors(),
  );
}

export function ApiAdminAction(
  summary: string,
  message: string,
  accepted = false,
) {
  return applyDecorators(
    ApiOperation({ summary }),
    accepted
      ? ApiAcceptedResponse({ schema: envelope({ type: 'object' }, message) })
      : ApiOkResponse({ schema: envelope({ type: 'object' }, message) }),
    ...errors(),
  );
}
