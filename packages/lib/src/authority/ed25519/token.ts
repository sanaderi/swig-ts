import {
  findAssociatedTokenPda,
  TOKEN_PROGRAM_ADDRESS,
} from '@solana-program/token';
import { AuthorityType } from '@swig-wallet/coder';
import type { Actions } from '../../actions';
import { SolanaPublicKey, SolInstruction } from '../../schema';
import { findSwigSubAccountPda } from '../../utils';
import { Authority, TokenBasedAuthority } from '../abstract';
import type { CreateAuthorityInfo } from '../createAuthority';
import { Ed25519Instruction } from '../instructions';
import type { Ed25519BasedAuthority } from './based';

export class Ed25519Authority
  extends TokenBasedAuthority
  implements Ed25519BasedAuthority
{
  type = AuthorityType.Ed25519;

  constructor(data: Uint8Array) {
    super(data);
  }

  get id() {
    return this.data;
  }

  get signer() {
    return this.data;
  }

  get ed25519PublicKey() {
    return new SolanaPublicKey(this.data);
  }

  sign(args: {
    swigAddress: SolanaPublicKey;
    payer: SolanaPublicKey;
    roleId: number;
    innerInstructions: SolInstruction[];
  }) {
    return Ed25519Instruction.signV1Instruction(
      {
        swig: args.swigAddress,
        payer: args.payer,
      },
      {
        authorityData: this.data,
        innerInstructions: args.innerInstructions,
        roleId: args.roleId,
      },
    );
  }

  addAuthority(args: {
    swigAddress: SolanaPublicKey;
    payer: SolanaPublicKey;
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
    payer: SolanaPublicKey;
    swigAddress: SolanaPublicKey;
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

  async subAccountCreate(args: {
    payer: SolanaPublicKey;
    swigAddress: SolanaPublicKey;
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
    payer: SolanaPublicKey;
    swigAddress: SolanaPublicKey;
    subAccount: SolanaPublicKey;
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
        authorityData: this.data,
        innerInstructions: args.innerInstructions,
      },
    );
  }

  subAccountToggle(args: {
    payer: SolanaPublicKey;
    swigAddress: SolanaPublicKey;
    subAccount: SolanaPublicKey;
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
    payer: SolanaPublicKey;
    swigAddress: SolanaPublicKey;
    subAccount: SolanaPublicKey;
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
    payer: SolanaPublicKey;
    swigAddress: SolanaPublicKey;
    subAccount: SolanaPublicKey;
    roleId: number;
    mint: SolanaPublicKey;
    amount: bigint;
    tokenProgram?: SolanaPublicKey;
  }) {
    const [swigToken] = await findAssociatedTokenPda({
      mint: args.mint.toAddress(),
      owner: args.swigAddress.toAddress(),
      tokenProgram: args.tokenProgram?.toAddress() ?? TOKEN_PROGRAM_ADDRESS,
    });

    const [subAccountToken] = await findAssociatedTokenPda({
      mint: args.mint.toAddress(),
      owner: args.subAccount.toAddress(),
      tokenProgram: args.tokenProgram?.toAddress() ?? TOKEN_PROGRAM_ADDRESS,
    });

    return Ed25519Instruction.subAccountWithdrawV1TokenInstruction(
      {
        payer: args.payer,
        swig: args.swigAddress,
        subAccount: args.subAccount,
        subAccountToken: new SolanaPublicKey(subAccountToken),
        swigToken: new SolanaPublicKey(swigToken),
        tokenProgram:
          args.tokenProgram ?? new SolanaPublicKey(TOKEN_PROGRAM_ADDRESS),
      },
      {
        roleId: args.roleId,
        authorityData: this.data,
        amount: args.amount,
      },
    );
  }
}

export function isEd25519Authority(
  authority: Authority,
): authority is Ed25519Authority {
  return authority instanceof Ed25519Authority;
}
