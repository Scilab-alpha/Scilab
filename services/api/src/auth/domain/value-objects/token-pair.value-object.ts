export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export function createTokenPair(
  accessToken: string,
  refreshToken: string,
): TokenPair {
  return { accessToken, refreshToken };
}
