import argon2 from 'argon2';

export const ARGON2_PARAMS = {
  type: argon2.argon2id,
  timeCost: 3,
  memoryCost: 65536,
  parallelism: 4,
} as const;

export function getArgon2Params() {
  return ARGON2_PARAMS;
}

export async function hashPin(pin: string): Promise<string> {
  return argon2.hash(pin, ARGON2_PARAMS);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, pin);
  } catch {
    return false;
  }
}
