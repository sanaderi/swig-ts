import { PublicKey } from '@solana/web3.js';
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

export function createEd25519AuthorityInfo(
  publicKey: PublicKey,
): CreateAuthorityInfo {
  let data = publicKey.toBytes();
  let type = AuthorityType.Ed25519;
  return { createAuthorityInfo: { data, type } };
}

export function createEd25519SessionAuthorityInfo(
  publicKey: PublicKey,
  maxSessionDuration: bigint,
  sessionKey?: PublicKey,
): CreateAuthorityInfo {
  let sessionData = getEd25519SessionEncoder().encode({
    publicKey: publicKey.toBytes(),
    sessionKey: sessionKey ? sessionKey.toBytes() : Uint8Array.from(Array(32)),
    currentSessionExpiration: 0n,
    maxSessionLength: maxSessionDuration,
  });
  let data = Uint8Array.from(sessionData.slice(0, 72));
  let type = AuthorityType.Ed25519Session;

  return { createAuthorityInfo: { data, type } };
}

/**
 *
 * @param publicKey Uncomporesed Publickey bytes or Hex string
 * @returns
 */
export function createSecp256k1AuthorityInfo(
  publicKey: string | Uint8Array,
): CreateAuthorityInfo {
  let data = getUnprefixedSecpBytes(publicKey, 64);
  let type = AuthorityType.Secp256k1;

  console.log('data len:', data.length);

  return { createAuthorityInfo: { data, type } };
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
): CreateAuthorityInfo {
  let publicKeyBytes = getUnprefixedSecpBytes(publicKey, 64);

  let sessionData = getCreateSecp256k1SessionEncoder().encode({
    publicKey: publicKeyBytes,
    sessionKey: sessionKey ? sessionKey.toBytes() : Uint8Array.from(Array(32)),
    maxSessionLength: maxSessionDuration,
  });

  let data = Uint8Array.from(sessionData);
  let type = AuthorityType.Secp256k1Session;

  return { createAuthorityInfo: { data, type } };
}
