import {
  address,
  getAddressCodec,
  getProgramDerivedAddress,
  type Address,
  type IInstruction,
} from '@solana/kit';
import {
  AuthorityType,
  getEd25519SessionDecoder,
  getEd25519SessionEncoder,
} from '@swig-wallet/coder';
import bs58 from 'bs58';
import type { Actions } from '../../actions';
import { TOKEN_PROGRAM_ADDRESS } from '../../consts';
import { createSwigInstruction } from '../../instructions';
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

  constructor(
    public data: Uint8Array,
    roleId?: number,
  ) {
    super(data, roleId ?? null);
  }

  static fromBytes(bytes: Uint8Array): Ed25519SessionAuthority {
    return new Ed25519SessionAuthority(bytes);
  }

  static uninitialized(
    publicKey: Address,
    maxSessionDuration: bigint,
    sessionKey?: Address,
  ): Ed25519SessionAuthority {
    const sessionData = getEd25519SessionEncoder().encode({
      publicKey: getAddressCodec().encode(publicKey),
      sessionKey: sessionKey
        ? getAddressCodec().encode(sessionKey)
        : Uint8Array.from(Array(32)),
      currentSessionExpiration: 0n,
      maxSessionLength: maxSessionDuration,
    });

    return new Ed25519SessionAuthority(Uint8Array.from(sessionData));
  }

  get id() {
    return Uint8Array.from(getAddressCodec().encode(this.info.publicKey));
  }

  get signer() {
    return Uint8Array.from(getAddressCodec().encode(this.sessionKeyAddress));
  }

  get publicKey() {
    return this.ed25519PublicKey;
  }

  get address() {
    return this.ed25519PublicKey;
  }

  get ed25519PublicKey(): Address {
    return this.info.publicKey;
  }

  get sessionKeyAddress(): Address {
    return this.info.sessionKey;
  }

  get sessionKey(): Address {
    return this.sessionKeyAddress;
  }

  get expirySlot() {
    return this.info.currentSessionExpiration;
  }

  get maxDuration() {
    return this.info.maxSessionLength;
  }

  createAuthorityData(): Uint8Array {
    return this.data.slice(0, 32 + 32 + 8);
  }

  private get info(): Ed25519SessionData {
    const data = getEd25519SessionDecoder().decode(this.data);
    return {
      ...data,
      publicKey: address(bs58.encode(new Uint8Array(data.publicKey))),
      sessionKey: address(bs58.encode(new Uint8Array(data.sessionKey))),
    };
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
        authorityData: getAddressCodec().encode(this.sessionKey),
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
        authorityData: getAddressCodec().encode(this.address),
        roleId: args.roleId,
        sessionDuration: args.sessionDuration ?? this.maxDuration,
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
        subAccount: address(subAccount),
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
        authorityData: getAddressCodec().encode(this.sessionKeyAddress),
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

  async subAccountWithdrawToken(args: {
    payer: Address;
    swigAddress: Address;
    subAccount: Address;
    roleId: number;
    mint: Address;
    amount: bigint;
    tokenProgram?: Address;
  }) {
    const tokenProgram = args.tokenProgram ?? TOKEN_PROGRAM_ADDRESS;

    const [swigToken] = await getProgramDerivedAddress({
      programAddress: tokenProgram,
      seeds: [
        Buffer.from(args.swigAddress),
        Buffer.from(TOKEN_PROGRAM_ADDRESS),
        Buffer.from(args.mint),
      ],
    });

    const [subAccountToken] = await getProgramDerivedAddress({
      programAddress: tokenProgram,
      seeds: [
        Buffer.from(args.subAccount),
        Buffer.from(TOKEN_PROGRAM_ADDRESS),
        Buffer.from(args.mint),
      ],
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

export type Ed25519SessionData = {
  publicKey: Address;
  sessionKey: Address;
  maxSessionLength: bigint;
  currentSessionExpiration: bigint;
};
