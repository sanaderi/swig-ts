import {
  findAssociatedTokenPda,
  TOKEN_PROGRAM_ADDRESS,
} from '@solana-program/token';
import { AuthorityType, getEd25519SessionDecoder } from '@swig-wallet/coder';
import type { Actions } from '../../actions';
import {
  SolanaPublicKey,
  type SolanaPublicKeyData,
  SolInstruction,
} from '../../schema';
import { findSwigSubAccountPda } from '../../utils';
import { Authority, SessionBasedAuthority } from '../abstract';
import type { CreateAuthorityInfo } from '../createAuthority';
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

  static fromBytes(bytes: Uint8Array): Ed25519SessionAuthority {
    return new Ed25519SessionAuthority(bytes);
  }

  get id() {
    return this.info.publicKey;
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
    return new SolanaPublicKey(this.info.publicKey);
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

  private get info(): Ed25519SessionData {
    const data = getEd25519SessionDecoder().decode(this.data);
    return {
      ...data,
      publicKey: new Uint8Array(data.publicKey),
      sessionKey: new SolanaPublicKey(new Uint8Array(data.sessionKey)),
    };
  }

  sign(args: {
    swigAddress: SolanaPublicKeyData;
    payer: SolanaPublicKeyData;
    roleId: number;
    innerInstructions: SolInstruction[];
  }) {
    return Ed25519Instruction.signV1Instruction(
      {
        swig: args.swigAddress,
        payer: args.payer,
      },
      {
        authorityData: new SolanaPublicKey(this.sessionKey).toBytes(),
        innerInstructions: args.innerInstructions,
        roleId: args.roleId,
      },
    );
  }

  addAuthority(args: {
    swigAddress: SolanaPublicKeyData;
    payer: SolanaPublicKeyData;
    actingRoleId: number;
    actions: Actions;
    newAuthorityInfo: CreateAuthorityInfo;
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
    payer: SolanaPublicKeyData;
    swigAddress: SolanaPublicKeyData;
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
    payer: SolanaPublicKeyData;
    swigAddress: SolanaPublicKeyData;
    newSessionKey: SolanaPublicKeyData;
    roleId: number;
    sessionDuration?: bigint;
  }) {
    return Ed25519Instruction.createSessionV1Instruction(
      {
        payer: args.payer,
        swig: args.swigAddress,
      },
      {
        authorityData: this.id,
        roleId: args.roleId,
        sessionDuration: args.sessionDuration ?? this.maxDuration,
        sessionKey: new SolanaPublicKey(args.newSessionKey).toBytes(),
      },
    );
  }

  async subAccountCreate(args: {
    payer: SolanaPublicKeyData;
    swigAddress: SolanaPublicKeyData;
    swigId: Uint8Array;
    roleId: number;
  }) {
    const [subAccount, bump] = await findSwigSubAccountPda(
      args.swigId,
      args.roleId,
    );
    return Ed25519Instruction.subAccountCreateV1Instruction(
      {
        payer: args.payer,
        swig: args.swigAddress,
        subAccount: new SolanaPublicKey(subAccount),
      },
      {
        roleId: args.roleId,
        authorityData: this.data,
        bump,
      },
    );
  }

  subAccountSign(args: {
    payer: SolanaPublicKeyData;
    swigAddress: SolanaPublicKeyData;
    subAccount: SolanaPublicKeyData;
    roleId: number;
    innerInstructions: SolInstruction[];
  }) {
    return Ed25519Instruction.subAccountSignV1Instruction(
      {
        payer: args.payer,
        swig: args.swigAddress,
        subAccount: args.subAccount,
      },
      {
        roleId: args.roleId,
        authorityData: this.sessionKey.toBytes(),
        innerInstructions: args.innerInstructions,
      },
    );
  }

  subAccountToggle(args: {
    payer: SolanaPublicKeyData;
    swigAddress: SolanaPublicKeyData;
    subAccount: SolanaPublicKeyData;
    roleId: number;
    enabled: boolean;
  }) {
    return Ed25519Instruction.subAccountToggleV1Instruction(
      {
        payer: args.payer,
        swig: args.swigAddress,
        subAccount: args.subAccount,
      },
      {
        roleId: args.roleId,
        authorityData: this.data,
        enabled: args.enabled,
      },
    );
  }

  subAccountWithdrawSol(args: {
    payer: SolanaPublicKeyData;
    swigAddress: SolanaPublicKeyData;
    subAccount: SolanaPublicKeyData;
    roleId: number;
    amount: bigint;
  }) {
    return Ed25519Instruction.subAccountWithdrawV1SolInstruction(
      {
        payer: args.payer,
        swig: args.swigAddress,
        subAccount: args.subAccount,
      },
      {
        roleId: args.roleId,
        authorityData: this.data,
        amount: args.amount,
      },
    );
  }

  async subAccountWithdrawToken(args: {
    payer: SolanaPublicKeyData;
    swigAddress: SolanaPublicKeyData;
    subAccount: SolanaPublicKeyData;
    roleId: number;
    mint: SolanaPublicKeyData;
    amount: bigint;
    tokenProgram?: SolanaPublicKeyData;
  }) {
    const mint = new SolanaPublicKey(args.mint).toAddress();
    const swigAddress = new SolanaPublicKey(args.swigAddress).toAddress();
    const subAccount = new SolanaPublicKey(args.subAccount).toAddress();
    const tokenProgram =
      new SolanaPublicKey(args.subAccount).toAddress() ?? TOKEN_PROGRAM_ADDRESS;

    const [swigToken] = await findAssociatedTokenPda({
      mint,
      owner: swigAddress,
      tokenProgram,
    });

    const [subAccountToken] = await findAssociatedTokenPda({
      mint,
      owner: subAccount,
      tokenProgram,
    });
    return Ed25519Instruction.subAccountWithdrawV1TokenInstruction(
      {
        payer: args.payer,
        swig: args.swigAddress,
        subAccount: args.subAccount,
        subAccountToken,
        swigToken,
        tokenProgram,
      },
      {
        roleId: args.roleId,
        authorityData: this.data,
        amount: args.amount,
      },
    );
  }
}

export function isEd25519SessionAuthority(
  authority: Authority,
): authority is Ed25519SessionAuthority {
  return authority instanceof Ed25519SessionAuthority;
}

type Ed25519SessionData = {
  publicKey: Uint8Array;
  sessionKey: SolanaPublicKey;
  maxSessionLength: bigint;
  currentSessionExpiration: bigint;
};
