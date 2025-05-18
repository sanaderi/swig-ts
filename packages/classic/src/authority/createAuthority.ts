import { hexToBytes } from '@noble/curves/abstract/utils';
import { PublicKey } from '@solana/web3.js';
import {
  AuthorityType,
  getCreateSecp256k1SessionEncoder,
  getEd25519SessionEncoder,
} from '@swig-wallet/coder';

export interface AuthorityInfo {
  data: Uint8Array;
  type: AuthorityType;
}

export function createEd25519AuthorityInfo(
  publicKey: PublicKey,
): AuthorityInfo {
  return {
    data: publicKey.toBytes(),
    type: AuthorityType.Ed25519,
  };
}

export function createEd25519SessionAuthorityInfo(
  publicKey: PublicKey,
  maxSessionDuration: bigint,
  sessionKey?: PublicKey,
): AuthorityInfo {
  let sessionData = getEd25519SessionEncoder().encode({
    publicKey: publicKey.toBytes(),
    sessionKey: sessionKey ? sessionKey.toBytes() : Uint8Array.from(Array(32)),
    currentSessionExpiration: 0n,
    maxSessionLength: maxSessionDuration,
  });

  return {
    data: Uint8Array.from(sessionData),
    type: AuthorityType.Ed25519Session,
  };
}

/**
 *
 * @param publicKey Uncomporesed Publickey bytes or Hex string
 * @returns
 */
export function createSecp256k1AuthorityInfo(
  publicKey: string | Uint8Array,
): AuthorityInfo {
  let publicKeyBytes: Uint8Array;

  if (typeof publicKey === 'string') {
    publicKeyBytes = hexToBytes(publicKey);
  } else {
    publicKeyBytes = publicKey;
  }

  return {
    data:
      publicKeyBytes.length === 65 ? publicKeyBytes.slice(1) : publicKeyBytes,
    type: AuthorityType.Secp256k1,
  };
}

/**
 *
 * @param publicKey Uncomporesed Publickey bytes or Hex string
 * @returns
 */
export function createSecp256k1SessionAuthorityInfo(
  publicKey: string | Uint8Array,
  maxSessionDuration: bigint,
  sessionKey?: PublicKey,
): AuthorityInfo {
  let publicKeyBytes: Uint8Array;

  if (typeof publicKey === 'string') {
    publicKeyBytes = hexToBytes(publicKey);
  } else {
    publicKeyBytes = publicKey;
  }

  let sessionData = getCreateSecp256k1SessionEncoder().encode({
    publicKey: publicKeyBytes,
    sessionKey: sessionKey ? sessionKey.toBytes() : Uint8Array.from(Array(32)),
    maxSessionLength: maxSessionDuration,
  });

  return {
    data: Uint8Array.from(sessionData),
    type: AuthorityType.Secp256k1Session,
  };
}
