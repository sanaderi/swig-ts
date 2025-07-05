import {
  AccountRole,
  address,
  getAddressDecoder,
  getAddressEncoder,
  isSignerRole,
  isWritableRole,
  type IAccountMeta,
} from '@solana/kit';
import BN from 'bn.js';
import { SWIG_PROGRAM_ADDRESS } from './consts';
import type { GenericInstruction } from './kit';

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

  static fromIAccountMeta = (meta: IAccountMeta) => {};

  getRole = (): Readonly<AccountRole> => {
    if (this.isWritable && this.isSigner) return AccountRole.WRITABLE_SIGNER;
    if (!this.isWritable && this.isSigner) return AccountRole.READONLY_SIGNER;
    if (this.isWritable && !this.isSigner) return AccountRole.WRITABLE;
    return AccountRole.READONLY;
  };

  getMetaWithRole = () => {
    return {
      address: this.pubkey.toAddress(),
      role: this.getRole(),
    };
  };
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

export class SInstruction<T extends KitInstruction | Web3Instruction> {
  constructor(private inst: T) {}

  program = (): SolanaPublicKey => {
    if (isKitInstruction(this.inst)) {
      return new SolanaPublicKey(this.inst.programAddress);
    }
    return new SolanaPublicKey(this.inst.programId.toBytes());
  };

  data = (): Uint8Array => {
    if (isKitInstruction(this.inst)) {
      return this.inst.data;
    }
    return this.inst.data;
  };

  accounts = () => {
    if (isKitInstruction(this.inst)) {
      return this.inst.accounts.map((meta) => new SAccountMeta(meta));
    }
    return this.inst.keys.map((meta) => new SAccountMeta(meta));
  };

  toKitInstruction = (): KitInstruction => {
    if (isKitInstruction(this.inst)) {
      return this.inst;
    }
    return {
      programAddress: this.program().toAddress(),
      accounts: this.accounts().map((acct) => acct.toKitAccountMeta()),
      data: this.data(),
    };
  };

  toWeb3Instruction = (): Web3Instruction => {
    if (isWeb3Instruction(this.inst)) {
      return this.inst;
    }
    return {
      programId: this.program(),
      data: this.data(),
      keys: this.accounts().map((acct) => acct.toWeb3AccountMeta()),
    };
  };
}

export class SAccountMeta<T extends KitAccountMeta | Web3AccountMeta> {
  constructor(private meta: T) {}

  static readonly = (publicKey: SolanaPublicKey) =>
    new this({ address: publicKey.toAddress(), role: AccountRole.READONLY });

  static readonlySigner = (publicKey: SolanaPublicKey) =>
    new this({
      address: publicKey.toAddress(),
      role: AccountRole.READONLY_SIGNER,
    });

  static writable = (publicKey: SolanaPublicKey) =>
    new this({ address: publicKey.toAddress(), role: AccountRole.WRITABLE });

  static writableSigner = (publicKey: SolanaPublicKey) =>
    new this({
      address: publicKey.toAddress(),
      role: AccountRole.WRITABLE_SIGNER,
    });

  isSigner = () => {
    if (isKitAccountMeta(this.meta)) {
      return isSignerRole(this.meta.role);
    }

    return this.meta.isSigner;
  };

  isWritable = () => {
    if (isKitAccountMeta(this.meta)) {
      return isWritableRole(this.meta.role);
    }

    return this.meta.isWritable;
  };

  publicKey = () => {
    if (isKitAccountMeta(this.meta)) {
      return new SolanaPublicKey(this.meta.address);
    }
    return new SolanaPublicKey(this.meta.pubkey.toBytes());
  };

  toKitAccountMeta = (): KitAccountMeta => {
    if (isKitAccountMeta(this.meta)) {
      return this.meta;
    }

    return this.#kitFromWeb3(this.meta);
  };

  toWeb3AccountMeta = (): Web3AccountMeta => {
    if (isWeb3AccountMeta(this.meta)) {
      return this.meta;
    }

    return this.#web3FromKit(this.meta);
  };

  #web3FromKit = (meta: KitAccountMeta): Web3AccountMeta => {
    const pubkey = new SolanaPublicKey(meta.address);
    return { pubkey, ...this.#getWeb3Role(meta.role) };
  };

  #kitFromWeb3 = (meta: Web3AccountMeta): KitAccountMeta => {
    const address = new SolanaPublicKey(meta.pubkey.toBytes()).toAddress();
    return { address, role: this.#getRole(meta) };
  };

  #getRole = (meta: Web3AccountMeta): AccountRole => {
    if (meta.isWritable && meta.isSigner) return AccountRole.WRITABLE_SIGNER;
    if (!meta.isWritable && meta.isSigner) return AccountRole.READONLY_SIGNER;
    if (meta.isWritable && !meta.isSigner) return AccountRole.WRITABLE;
    return AccountRole.READONLY;
  };

  #getWeb3Role = (
    role: AccountRole,
  ): { isSigner: boolean; isWritable: boolean } => {
    if (role === AccountRole.WRITABLE_SIGNER) {
      return { isSigner: true, isWritable: true };
    }

    if (role === AccountRole.READONLY_SIGNER) {
      return { isSigner: true, isWritable: false };
    }

    if (role === AccountRole.WRITABLE) {
      return { isSigner: false, isWritable: true };
    }

    return { isSigner: false, isWritable: false };
  };
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
  constructor(data: SolanaPublicKeyData) {
    let bytes =
      typeof data === 'string'
        ? new Uint8Array(getAddressEncoder().encode(address(data)))
        : isPublicKey(data)
          ? data.toBytes()
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

export function isWeb3Instruction<
  T extends Web3PublicKey,
  U extends Uint8Array,
>(ix: KitInstruction | Web3Instruction<T, U>): ix is Web3Instruction<T, U> {
  return 'programId' in ix && 'keys' in ix;
}

export function isKitInstruction<T extends Web3PublicKey, U extends Uint8Array>(
  ix: KitInstruction | Web3Instruction<T, U>,
): ix is KitInstruction {
  return 'programAddress' in ix && 'accounts' in ix;
}

export type KitInstruction<
  T extends string = string,
  U extends IAccountMeta[] = IAccountMeta[],
> = GenericInstruction<T, U>;

export interface Web3Instruction<
  T extends Web3PublicKey = Web3PublicKey,
  U extends Uint8Array = Uint8Array,
> {
  programId: T;
  keys: Web3AccountMeta<T>[];
  data: U;
}

export function isKitAccountMeta<T extends Web3PublicKey>(
  meta: KitAccountMeta | Web3AccountMeta<T>,
): meta is KitAccountMeta {
  return 'address' in meta && 'role' in meta;
}

export function isWeb3AccountMeta<T extends Web3PublicKey>(
  meta: KitAccountMeta | Web3AccountMeta<T>,
): meta is Web3AccountMeta<T> {
  return 'pubkey' in meta && 'isWritable' in meta && 'isSigner' in meta;
}

export type KitAccountMeta<T extends string = string> = IAccountMeta<T>;

export type Web3AccountMeta<T extends Web3PublicKey = Web3PublicKey> = {
  pubkey: T;
  isWritable: boolean;
  isSigner: boolean;
};

export interface Web3PublicKey {
  toBase58(): string;
  toBytes(): Uint8Array;
}

export interface PublicKey extends Web3PublicKey {
  _bn: BN;
}

function isPublicKey(obj: any): obj is Web3PublicKey {
  return (
    typeof obj === 'object' && 'toBase58' in obj && 'toBytes' in obj
    // && obj?._bn instanceof BN
    // && (obj satisfies Web3PublicKey)
  );
}

export class SolAccountMeta {
  publicKey: SolanaPublicKey;
  writable: boolean;
  signer: boolean;

  constructor(data: {
    publicKey: SolanaPublicKey;
    writable: boolean;
    signer: boolean;
  }) {
    this.publicKey = data.publicKey;
    this.writable = data.writable;
    this.signer = data.signer;
  }

  static readonly = (publicKey: SolanaPublicKey): SolAccountMeta => {
    return new SolAccountMeta({ publicKey, signer: false, writable: false });
  };

  static readonlySigner = (publicKey: SolanaPublicKey): SolAccountMeta => {
    return new SolAccountMeta({ publicKey, signer: true, writable: false });
  };

  static writable = (publicKey: SolanaPublicKey): SolAccountMeta => {
    return new SolAccountMeta({ publicKey, signer: false, writable: true });
  };

  static writableSigner = (publicKey: SolanaPublicKey): SolAccountMeta => {
    return new SolAccountMeta({ publicKey, signer: true, writable: true });
  };

  static fromWeb3AccountMeta = <T extends Web3PublicKey = Web3PublicKey>(
    meta: Web3AccountMeta<T>,
  ): SolAccountMeta => {
    return new this({
      publicKey: new SolanaPublicKey(meta.pubkey),
      signer: meta.isSigner,
      writable: meta.isWritable,
    });
  };

  static fromKitAccountMeta = <T extends IAccountMeta = IAccountMeta>(
    meta: T,
  ): SolAccountMeta => {
    return new this({
      publicKey: new SolanaPublicKey(meta.address),
      signer: isSignerRole(meta.role),
      writable: isWritableRole(meta.role),
    });
  };

  setWritable = (isWritable: boolean) => {
    this.writable = isWritable;
  };

  setSigner = (isSigner: boolean) => {
    this.writable = isSigner;
  };

  toWeb3AccountMeta = (): Web3AccountMeta => {
    return {
      pubkey: this.publicKey,
      isSigner: this.signer,
      isWritable: this.writable,
    };
  };

  toKitAccountMeta = <T extends IAccountMeta = IAccountMeta>(): T => {
    return {
      address: this.publicKey.toAddress(),
      role: this.#getRole(),
    } as T;
  };

  #getRole = (): AccountRole => {
    if (this.writable && this.signer) return AccountRole.WRITABLE_SIGNER;
    if (!this.writable && this.signer) return AccountRole.READONLY_SIGNER;
    if (this.writable && !this.signer) return AccountRole.WRITABLE;
    return AccountRole.READONLY;
  };
}

export class SolInstruction {
  program: SolanaPublicKey;
  data: Uint8Array;
  accounts: SolAccountMeta[];

  constructor(inst: {
    program: SolanaPublicKey;
    data: Uint8Array;
    accounts: SolAccountMeta[];
  }) {
    this.program = inst.program;
    this.accounts = inst.accounts;
    this.data = inst.data;
  }

  static fromWeb3Instruction = <
    T extends Web3PublicKey = Web3PublicKey,
    U extends Uint8Array = Uint8Array,
  >(
    inst: Web3Instruction<T, U>,
  ): SolInstruction => {
    return new this({
      data: inst.data,
      accounts: inst.keys.map((meta) =>
        SolAccountMeta.fromWeb3AccountMeta(meta),
      ),
      program: new SolanaPublicKey(inst.programId),
    });
  };

  static fromKitInstruction = <
    T extends string = string,
    U extends IAccountMeta[] = IAccountMeta[],
  >(
    inst: KitInstruction<T, U>,
  ): SolInstruction => {
    return new SolInstruction({
      program: new SolanaPublicKey(inst.programAddress),
      data: inst.data,
      accounts: inst.accounts.map((acct) =>
        SolAccountMeta.fromKitAccountMeta(acct),
      ),
    });
  };

  toWeb3Instruction = (): Web3Instruction => {
    return {
      data: this.data,
      keys: this.accounts.map((meta) => meta.toWeb3AccountMeta()),
      programId: this.program,
    };
  };

  toKitInstruction = (): KitInstruction => {
    return {
      accounts: this.accounts.map((acct) => acct.toKitAccountMeta()),
      data: this.data,
      programAddress: this.program.toAddress(),
    };
  };
}

export function swigInst(accounts: SolAccountMeta[], data: Uint8Array) {
  return new SolInstruction({
    data,
    accounts,
    program: new SolanaPublicKey(SWIG_PROGRAM_ADDRESS),
  });
}

export type SolanaPublicKeyData = Uint8Array | string | Web3PublicKey;

export class SwigInstructionContext {
  preInstructions: SolInstruction[];
  postInstructions: SolInstruction[];
  swigInstruction: SolInstruction;

  constructor(instructions: {
    swigInstruction: SolInstruction;
    preInstructions?: SolInstruction[];
    postInstructions?: SolInstruction[];
  }) {
    this.swigInstruction = instructions.swigInstruction ?? [];
    this.preInstructions = instructions.preInstructions ?? [];
    this.postInstructions = instructions.preInstructions ?? [];
  }

  getKitInstructions = () => {
    return [
      ...this.preInstructions.map((ix) => ix.toKitInstruction()),
      this.swigInstruction.toKitInstruction(),
      ...this.postInstructions.map((ix) => ix.toKitInstruction()),
    ];
  };

  getWeb3Instructions = () => {
    return [
      ...this.preInstructions.map((ix) => ix.toWeb3Instruction()),
      this.swigInstruction.toWeb3Instruction(),
      ...this.postInstructions.map((ix) => ix.toWeb3Instruction()),
    ];
  };
}
