import { type Address } from '@solana/kit';
import {
  AuthorityType,
  getCreateSecp256k1SessionEncoder,
  getEd25519SessionEncoder,
} from '@swig-wallet/coder';
import { getUnprefixedSecpBytes } from '../utils';

export type AuthorityCreateInfo = { data: Uint8Array; type: AuthorityType };

export interface CreateAuthorityInfo {
  createAuthorityInfo: AuthorityCreateInfo;
}

/**
 * Creates an Ed25519 authority info object.
 * @param publicKey The Ed25519 public key as a 32-byte Uint8Array.
 * @returns An object containing the authority creation data and type.
 */
export function createEd25519AuthorityInfo(
  publicKey: Address,
): CreateAuthorityInfo {
  const data = Uint8Array.from(publicKey);
  const type = AuthorityType.Ed25519;
  return { createAuthorityInfo: { data, type } };
}

/**
 * Creates an Ed25519 session authority info object.
 * @param publicKey The Ed25519 public key as a 32-byte Uint8Array.
 * @param maxSessionDuration The maximum session duration as a bigint.
 * @param sessionKey Optional session key as a 32-byte Uint8Array.
 * @returns An object containing the authority creation data and type.
 */
export function createEd25519SessionAuthorityInfo(
  publicKey: Address,
  maxSessionDuration: bigint,
  sessionKey?: Address,
): CreateAuthorityInfo {
  const sessionData = getEd25519SessionEncoder().encode({
    publicKey: Uint8Array.from(publicKey),
    sessionKey: sessionKey
      ? Uint8Array.from(sessionKey)
      : Uint8Array.from(Array(32)),
    currentSessionExpiration: 0n,
    maxSessionLength: maxSessionDuration,
  });
  const data = Uint8Array.from(sessionData.slice(0, 72));
  const type = AuthorityType.Ed25519Session;

  return { createAuthorityInfo: { data, type } };
}

/**
 * Creates a Secp256k1 authority info object.
 * @param publicKey The uncompressed Secp256k1 public key, as either:
 *   - a 64-byte Uint8Array (no prefix, just x and y concatenated), or
 *   - a 128-character hex string (no prefix, just x and y concatenated).
 * @returns An object containing the authority creation data and type.
 */
export function createSecp256k1AuthorityInfo(
  publicKey: string | Uint8Array,
): CreateAuthorityInfo {
  const data = getUnprefixedSecpBytes(publicKey, 64);
  const type = AuthorityType.Secp256k1;

  return { createAuthorityInfo: { data, type } };
}

/**
 * Creates a Secp256k1 session authority info object.
 * @param publicKey The uncompressed Secp256k1 public key, as either:
 *   - a 64-byte Uint8Array (no prefix, just x and y concatenated), or
 *   - a 128-character hex string (no prefix, just x and y concatenated).
 * @param maxSessionDuration The maximum session duration as a bigint.
 * @param sessionKey Optional session key as a 32-byte Uint8Array.
 * @returns An object containing the authority creation data and type.
 */
export function createSecp256k1SessionAuthorityInfo(
  publicKey: string | Uint8Array,
  maxSessionDuration: bigint,
  sessionKey?: Address,
): CreateAuthorityInfo {
  const publicKeyBytes = getUnprefixedSecpBytes(publicKey, 64);

  const sessionData = getCreateSecp256k1SessionEncoder().encode({
    publicKey: publicKeyBytes,
    sessionKey: sessionKey
      ? Uint8Array.from(sessionKey)
      : Uint8Array.from(Array(32)),
    maxSessionLength: maxSessionDuration,
  });

  const data = Uint8Array.from(sessionData);
  const type = AuthorityType.Secp256k1Session;

  return { createAuthorityInfo: { data, type } };
}
