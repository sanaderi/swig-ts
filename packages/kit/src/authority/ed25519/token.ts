import {
  address,
  getAddressCodec,
  type Address,
  type IInstruction,
} from '@solana/kit';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { AuthorityType } from '@swig-wallet/coder';
import bs58 from 'bs58';
import type { Actions } from '../../actions';
import { createSwigInstruction } from '../../instructions';
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

  constructor(data: Uint8Array, roleId?: number) {
    super(data, roleId ?? null);
  }

  static fromAddress(addr: Address): Ed25519Authority {
    return new Ed25519Authority(
      Uint8Array.from(getAddressCodec().encode(addr)),
    );
  }

  get id() {
    return this.data;
  }

  get signer() {
    return this.data;
  }

  get publicKey() {
    return this.ed25519PublicKey;
  }

  get address() {
    return this.ed25519PublicKey;
  }

  get ed25519PublicKey(): Address {
    return address(bs58.encode(this.data));
  }

  createAuthorityData() {
    return this.data;
  }

  async create(args: {
    payer: Address;
    id: Uint8Array;
    actions: Actions;
  }): Promise<IInstruction> {
    return await createSwigInstruction(
      { payer: args.payer },
      {
        authorityData: this.createAuthorityData(),
        id: args.id,
        actions: args.actions.bytes(),
        authorityType: this.type,
        noOfActions: args.actions.count,
      },
    );
  }

  sign(args: {
    swigAddress: Address;
    payer: Address;
    roleId: number;
    innerInstructions: IInstruction[];
  }) {
    return Ed25519Instruction.signV1Instruction(
      {
        swig: args.swigAddress,
        payer: args.payer,
      },
      {
        authorityData: this.data,
        innerInstructions: args.innerInstructions as IInstruction[],
        roleId: args.roleId,
      },
    );
  }

  addAuthority(args: {
    swigAddress: Address;
    payer: Address;
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
        newAuthorityData: args.newAuthorityInfo.createAuthorityInfo.data,
        newAuthorityType: args.newAuthorityInfo.createAuthorityInfo.type,
        noOfActions: args.actions.count,
      },
    );
  }

  removeAuthority(args: {
    payer: Address;
    swigAddress: Address;
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
    payer: Address;
    swigAddress: Address;
    newSessionKey: Address;
    roleId: number;
    sessionDuration?: bigint;
  }) {
    return Ed25519Instruction.createSessionV1Instruction(
      {
        payer: args.payer,
        swig: args.swigAddress,
      },
      {
        authorityData: this.data,
        roleId: args.roleId,
        sessionDuration: args.sessionDuration ?? 0n,
        sessionKey: getAddressCodec().encode(args.newSessionKey),
      },
    );
  }

  async subAccountCreate(args: {
    payer: Address;
    swigAddress: Address;
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
        subAccount: address(bs58.encode(Uint8Array.from(subAccount))),
      },
      {
        roleId: args.roleId,
        authorityData: this.data,
        bump,
      },
    );
  }

  subAccountSign(args: {
    payer: Address;
    swigAddress: Address;
    subAccount: Address;
    roleId: number;
    innerInstructions: IInstruction[];
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
        innerInstructions: args.innerInstructions as IInstruction[],
      },
    );
  }

  subAccountToggle(args: {
    payer: Address;
    swigAddress: Address;
    subAccount: Address;
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
    payer: Address;
    swigAddress: Address;
    subAccount: Address;
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

  subAccountWithdrawToken(args: {
    payer: Address;
    swigAddress: Address;
    subAccount: Address;
    roleId: number;
    mint: Address;
    amount: bigint;
    tokenProgram?: Address;
  }) {
    // If you have a kit-native getAssociatedTokenAddress, use it. Otherwise, convert Address to PublicKey for SPL compatibility.
    // This is a placeholder for kit-native SPL support.
    return Ed25519Instruction.subAccountWithdrawV1TokenInstruction(
      {
        payer: args.payer,
        swig: args.swigAddress,
        subAccount: args.subAccount,
        subAccountToken: args.subAccount, // Replace with kit-native SPL support if available
        swigToken: args.swigAddress, // Replace with kit-native SPL support if available
        tokenProgram:
          args.tokenProgram ??
          address(bs58.encode(TOKEN_PROGRAM_ID.toBuffer())),
      },
      {
        roleId: args.roleId,
        authorityData: this.data,
        amount: args.amount,
      },
    );
  }
}

export function getEd25519AuthorityFromAddress(addr: Address) {
  return Ed25519Authority.fromAddress(addr);
}

export function isEd25519Authority(
  authority: Authority,
): authority is Ed25519Authority {
  return authority instanceof Ed25519Authority;
}
