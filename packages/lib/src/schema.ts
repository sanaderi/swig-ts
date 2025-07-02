import {
  AccountRole,
  address,
  getAddressDecoder,
  getAddressEncoder,
} from '@solana/kit';

export class SolanaAccountMeta {
  pubkey: SolanaPublicKey;
  
  private isSigner: boolean;
  private isWritable: boolean;

  private constructor(meta: {
    pubkey: SolanaPublicKey;
    isSigner: boolean;
    isWritable: boolean;
  }) {
    this.pubkey = meta.pubkey;
    this.isSigner = meta.isSigner;
    this.isWritable = meta.isWritable;
  }

  static readonly = (pubkey: SolanaPublicKey) =>  {

  }

  getRole = (): Readonly<AccountRole> => {
    if (this.isWritable && this.isSigner) return AccountRole.WRITABLE_SIGNER;
    if (!this.isWritable && this.isSigner) return AccountRole.READONLY_SIGNER;
    if (this.isWritable && !this.isSigner) return AccountRole.WRITABLE;
    return AccountRole.READONLY;
  };

  getMetaWithRole = () => {
    return {
      address: this.pubkey.toAddress(),
      role: this.getRole()
    }
  }
}

export class SolanaInstructionContext {
  keys: SolanaAccountMeta[];
  data: Uint8Array;
  programId: SolanaPublicKey;
  constructor(ctx: {
    keys: SolanaAccountMeta[];
    data: Uint8Array;
    programId: SolanaPublicKey;
  }) {
    this.keys = ctx.keys;
    this.data = ctx.data;
    this.programId = ctx.programId;
  }
}

/**
 * Utility representing a Solana PublicKey
 */
export class SolanaPublicKey {
  #bytes: Uint8Array;

  /**
   * Creates a new {@link SolanaPublicKey} instance
   *
   * @param data 32-byte publickey bytes or Base58-enoded publickey
   */
  constructor(data: Uint8Array | string) {
    let bytes =
      typeof data === 'string'
        ? new Uint8Array(getAddressEncoder().encode(address(data)))
        : data;

    if (bytes.length !== 32) {
      throw new Error(
        `Invalid PublicKey byte length. Lenght is ${bytes.length}, not 32 bytes`,
      );
    }

    this.#bytes = bytes;
  }

  toBytes = () => {
    return this.#bytes;
  };

  toAddress = () => {
    return getAddressDecoder().decode(this.#bytes);
  };

  toBase58 = () => {
    return this.toAddress().toString();
  };
}
