import { createCorsOptions, parseClientUrls } from '@/shared/http/cors.config';

describe('CORS configuration', () => {
  it('parses one or more comma-separated client origins', () => {
    expect(
      parseClientUrls(' https://web.example.com, http://localhost:3000 '),
    ).toEqual(['https://web.example.com', 'http://localhost:3000']);
  });

  it('allows credentials only for configured origins', () => {
    expect(createCorsOptions('https://web.example.com')).toEqual({
      origin: ['https://web.example.com'],
      credentials: true,
    });
    expect(createCorsOptions()).toEqual({
      origin: false,
      credentials: true,
    });
  });
});
