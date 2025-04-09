import { AuthorityType } from '@swig/coder';
import { Authority } from './abstract';

export class Secp256k1Authority extends Authority {
  constructor(public data: any) {
    super(data, AuthorityType.Secp256k1);
  }

  static fromBytes(bytes: Uint8Array): Secp256k1Authority {
    return new Secp256k1Authority(bytes);
  }
}
