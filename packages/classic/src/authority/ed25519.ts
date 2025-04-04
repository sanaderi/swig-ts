import type { PublicKey } from '@solana/web3.js';
import { AuthorityType } from '@swig/coder';
import { Authority } from './abstract';

/**
 * @deprecated use `Authority.ed25519()` instead
 */
export class Ed25519Authority extends Authority {
  constructor(public address: PublicKey) {
    let bytes = address.toBytes();
    super(bytes, AuthorityType.Ed25519);
  }
}
