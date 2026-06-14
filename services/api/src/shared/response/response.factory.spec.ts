import {
  createErrorResponse,
  createSuccessResponse,
  isApiResponse,
} from '@/shared/response/response.factory';

describe('response factory', () => {
  it('creates success envelopes', () => {
    expect(createSuccessResponse({ id: '1' }, 'Done')).toEqual({
      success: true,
      message: 'Done',
      data: { id: '1' },
    });
  });

  it('creates failure envelopes', () => {
    expect(createErrorResponse('Authentication failed')).toEqual({
      success: false,
      message: 'Authentication failed',
      data: {},
    });
  });

  it('detects existing envelopes', () => {
    expect(isApiResponse(createSuccessResponse(null))).toBe(true);
    expect(isApiResponse({ ok: true })).toBe(false);
  });
});
