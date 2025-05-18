import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { AuthorityType, getEd25519SessionDecoder } from '@swig-wallet/coder';
import type { Actions } from '../../actions';
import { Authority, SessionBasedAuthority } from '../abstract';
import type { AuthorityInfo } from '../createAuthority';
import { Ed25519Instruction } from '../instructions';
import type { Ed25519BasedAuthority } from './based';

export class Ed25519SessionAuthority
  extends SessionBasedAuthority
  implements Ed25519BasedAuthority
{
  type = AuthorityType.Ed25519Session;

  constructor(public data: Uint8Array) {
    super(data);
  }

  get id() {
    return this.info.publicKey.toBytes();
  }

  get signer() {
    return this.sessionKey.toBytes();
  }

  get publicKey() {
    return this.ed25519PublicKey;
  }

  get address() {
    return this.ed25519PublicKey;
  }

  get ed25519PublicKey() {
    return this.info.publicKey;
  }

  get sessionKey() {
    return this.info.sessionKey;
  }

  get expirySlot() {
    return this.info.currentSessionExpiration;
  }

  get maxDuration() {
    return this.info.maxSessionLength;
  }

  async createAuthorityData() {
    return this.data.slice(0, 32 + 32 + 8);
  }

  private get info(): Ed25519SessionData {
    let data = getEd25519SessionDecoder().decode(this.data);
    return {
      ...data,
      publicKey: new PublicKey(data.publicKey),
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
  }) {
    return Ed25519Instruction.addAuthorityV1Instruction(
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
    );
  }

  removeAuthority(args: {
    payer: PublicKey;
    swigAddress: PublicKey;
    roleId: number;
    roleIdToRemove: number;
  }) {
    return Ed25519Instruction.removeAuthorityV1Instruction(
      {
        payer: args.payer,
        swig: args.swigAddress,
      },
      {
        actingRoleId: args.roleId,
        authorityData: this.data,
        authorityToRemoveId: args.roleIdToRemove,
      },
    );
  }

  createSession(args: {
    payer: PublicKey;
    swigAddress: PublicKey;
    newSessionKey: PublicKey;
    roleId: number;
    sessionDuration?: bigint;
  }) {
    return Ed25519Instruction.createSessionV1Instruction(
      {
        payer: args.payer,
        swig: args.swigAddress,
      },
      {
        authorityData: this.address.toBytes(),
        roleId: args.roleId,
        sessionDuration: args.sessionDuration ?? this.maxDuration,
        sessionKey: args.newSessionKey.toBytes(),
      },
    );
  }
}

export function isEd25519SessionAuthority(
  authority: Authority,
): authority is Ed25519SessionAuthority {
  return authority instanceof Ed25519SessionAuthority;
}

export type Ed25519SessionData = {
  publicKey: PublicKey;
  sessionKey: PublicKey;
  maxSessionLength: bigint;
  currentSessionExpiration: bigint;
};
