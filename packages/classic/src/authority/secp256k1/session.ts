import { bytesToHex } from '@noble/curves/abstract/utils';
import { PublicKey, type TransactionInstruction } from '@solana/web3.js';
import { AuthorityType, getSecp256k1SessionDecoder } from '@swig-wallet/coder';
import type { Actions } from '../../actions';
import { compressedPubkeyToAddress } from '../../utils';
import { SessionBasedAuthority } from '../abstract';
import type { AuthorityInfo } from '../createAuthority';
import { Ed25519Instruction, Secp256k1Instruction } from '../instructions';
import type { InstructionDataOptions } from '../instructions/interface';
import type { Secp256k1BasedAuthority } from './based';

export class Secp256k1SessionAuthority
  extends SessionBasedAuthority
  implements Secp256k1BasedAuthority
{
  type = AuthorityType.Secp256k1Session;

  constructor(data: Uint8Array) {
    super(data);
  }

  get id() {
    return this.secp256k1Address;
  }

  get signer() {
    return this.sessionKey.toBytes();
  }

  get publicKeyBytes(): Uint8Array {
    return this.info.publicKey;
  }

  get publicKeyString(): string {
    return bytesToHex(this.publicKeyBytes);
  }

  get secp256k1Address() {
    return compressedPubkeyToAddress(this.publicKeyBytes);
  }

  get secp256k1AddressString(): string {
    return `Ox${bytesToHex(this.secp256k1Address)}`;
  }

  get secp256k1PublicKey() {
    return this.publicKeyBytes;
  }

  get secp256k1PublicKeyString() {
    return this.publicKeyString;
  }

  get sessionKey(): PublicKey {
    return this.info.sessionKey;
  }

  get expirySlot() {
    return this.info.currentSessionExpiration;
  }

  get maxDuration() {
    return this.info.maxSessionLength;
  }

  private get info(): SessionData {
    let data = getSecp256k1SessionDecoder().decode(this.data);

    return {
      ...data,
      publicKey: Uint8Array.from(data.publicKey),
      sessionKey: new PublicKey(data.sessionKey),
    };
  }

  sign(args: {
    swigAddress: PublicKey;
    payer: PublicKey;
    roleId: number;
    innerInstructions: TransactionInstruction[];
  }) {
    return Ed25519Instruction.signV1Instruction(
      {
        swig: args.swigAddress,
        payer: args.payer,
      },
      {
        authorityData: this.sessionKey.toBytes(),
        innerInstructions: args.innerInstructions,
        roleId: args.roleId,
      },
    );
  }

  addAuthority(args: {
    swigAddress: PublicKey;
    payer: PublicKey;
    actingRoleId: number;
    actions: Actions;
    newAuthorityInfo: AuthorityInfo;
    options: InstructionDataOptions;
  }) {
    return Secp256k1Instruction.addAuthorityV1Instruction(
      {
        payer: args.payer,
        swig: args.swigAddress,
      },
      {
        actingRoleId: args.actingRoleId,
        actions: args.actions.bytes(),
        authorityData: this.data,
        newAuthorityData: args.newAuthorityInfo.data,
        newAuthorityType: args.newAuthorityInfo.type,
        noOfActions: args.actions.count,
      },
      args.options,
    );
  }

  removeAuthority(args: {
    payer: PublicKey;
    swigAddress: PublicKey;
    roleId: number;
    roleIdToRemove: number;
    options: InstructionDataOptions;
  }) {
    return Secp256k1Instruction.removeAuthorityV1Instruction(
      {
        payer: args.payer,
        swig: args.swigAddress,
      },
      {
        actingRoleId: args.roleId,
        authorityData: this.data,
        authorityToRemoveId: args.roleIdToRemove,
      },
      args.options,
    );
  }

  createSession(args: {
    payer: PublicKey;
    swigAddress: PublicKey;
    newSessionKey: PublicKey;
    roleId: number;
    sessionDuration?: bigint;
    options: InstructionDataOptions;
  }) {
    return Secp256k1Instruction.createSessionV1Instruction(
      {
        payer: args.payer,
        swig: args.swigAddress,
      },
      {
        authorityData: this.data,
        roleId: args.roleId,
        sessionDuration: args.sessionDuration ?? this.maxDuration,
        sessionKey: args.newSessionKey.toBytes(),
      },
      args.options,
    );
  }
}

export type SessionData = {
  publicKey: Uint8Array;
  sessionKey: PublicKey;
  maxSessionLength: bigint;
  currentSessionExpiration: bigint;
};
