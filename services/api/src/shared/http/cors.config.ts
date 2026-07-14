import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

export function createCorsOptions(
  clientUrl = process.env.CLIENT_URL,
): CorsOptions {
  const allowedOrigins = parseClientUrls(clientUrl);

  return {
    origin: allowedOrigins.length > 0 ? allowedOrigins : false,
    credentials: true,
  };
}

export function parseClientUrls(value?: string): string[] {
  return (value ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}
