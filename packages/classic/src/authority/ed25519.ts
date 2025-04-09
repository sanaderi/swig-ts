import { PublicKey } from '@solana/web3.js';
import { AuthorityType } from '@swig/coder';
import { Authority } from './abstract';

export class Ed25519Authority extends Authority {
  constructor(public address: PublicKey) {
    let bytes = address.toBytes();
    super(bytes, AuthorityType.Ed25519);
  }

  static fromBytes(bytes: Uint8Array): Ed25519Authority {
    return new Ed25519Authority(new PublicKey(bytes));
  }

  encode() {
    return this.address.toBytes();
  }
}

export class Ed25519SessionAuthority extends Authority {
  constructor(public address: PublicKey) {
    let bytes = address.toBytes();
    super(bytes, AuthorityType.Ed25519Session);
  }

  static fromBytes(bytes: Uint8Array): Ed25519SessionAuthority {
    return new Ed25519SessionAuthority(new PublicKey(bytes));
  }

  encode() {
    return this.address.toBytes();
  }
}

export function isEd25519Authority(
  authority: Authority,
): authority is Ed25519Authority {
  return authority instanceof Ed25519Authority;
}

export function isEd25519SessionAuthority(
  authority: Authority,
): authority is Ed25519SessionAuthority {
  return authority instanceof Ed25519SessionAuthority;
}
