import type { Authority } from '../abstract';
import type { Ed25519BasedAuthority } from '../ed25519';

export interface Secp256k1BasedAuthority {
  /**
   * 33-byte Secp256k1 compressed publickey bytes
   */
  secp256k1PublicKey: Uint8Array;
  /**
   * Secp256k1 compressed publickey string
   */
  secp256k1PublicKeyString: string;
}

export function isSecp256k1BasedAuthority(
  authority: Authority,
): authority is Authority & Ed25519BasedAuthority {
  return (
    'secp256k1PublicKey' in authority &&
    'secp256k1PublicKeyString' in authority
  );
}

export function getSecp256k1BasedAuthority(authority: Authority) {
  if (!isSecp256k1BasedAuthority(authority)) return null;
  return authority;
}
