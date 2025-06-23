import { type Address } from '@solana/kit';
import type { Authority } from '../abstract';

export interface Ed25519BasedAuthority {
  ed25519PublicKey: Address;
}

export function isEd25519BasedAuthority(
  authority: Authority,
): authority is Authority & Ed25519BasedAuthority {
  return 'ed25519PublicKey' in authority;
}

export function getEd25519BasedAuthority(authority: Authority) {
  if (!isEd25519BasedAuthority(authority)) return null;
  return authority;
}
