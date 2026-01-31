import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';
import { env } from '../config/env';
import { Role } from '@prisma/client';

export interface TokenPayload {
  userId: string;
  role: Role;
}

export interface DecodedToken extends JwtPayload, TokenPayload {}

const ACCESS_TOKEN_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

export function generateAccessToken(payload: TokenPayload): string {
  const options: SignOptions = {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  };
  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function generateRefreshToken(payload: TokenPayload): string {
  const options: SignOptions = {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  };
  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function verifyToken(token: string): DecodedToken {
  return jwt.verify(token, env.JWT_SECRET) as DecodedToken;
}

export function getRefreshTokenExpiryDate(): Date {
  const now = new Date();
  now.setDate(now.getDate() + 7); // 7 days from now
  return now;
}
