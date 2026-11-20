import { createHash, randomBytes, randomUUID } from 'node:crypto';

export const hashRefreshToken = (token) => {
  return createHash('sha256').update(token).digest('hex');
};
export const generateRefreshToken = () => {
  return randomBytes(64).toString('hex');
};

export const generateTokenFamilyId = () => {
  return randomUUID();
};
