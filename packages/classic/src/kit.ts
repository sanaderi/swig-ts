import {
  Connection,
  PublicKey,
  TransactionInstruction,
  type Commitment,
  type GetAccountInfoConfig,
} from '@solana/web3.js';
import { getSwigCodec, type Role, type SwigAccount } from '@swig/coder';
import { fetchMaybeSwigAccount, fetchSwigAccount } from './accounts';
import { SwigActions } from './actions/swig';
import { Authority } from './authority';
import { SWIG_PROGRAM_ADDRESS } from './consts';

export function findSwigPda(id: Uint8Array): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('swig'), Buffer.from(id)],
    SWIG_PROGRAM_ADDRESS,
  );
}

export class Swig {
  private constructor(
    public readonly address: PublicKey,
    private account: SwigAccount,
  ) {}

  get id() {
    return this.account.id;
  }

  get roles() {
    return this.account.roles.map(
      (role, i) => new SwigRole(role, this.address, i),
    );
  }

  static async fetchNullable(
    connection: Connection,
    swigAddress: PublicKey,
    config?: Commitment | GetAccountInfoConfig,
  ): Promise<Swig | null> {
    let maybeSwig = await fetchMaybeSwigAccount(
      connection,
      swigAddress,
      config,
    );
    if (!maybeSwig) {
      return null;
    }
    return new Swig(swigAddress, maybeSwig);
  }

  static async fetch(
    connection: Connection,
    swigAddress: PublicKey,
    config?: Commitment | GetAccountInfoConfig,
  ): Promise<Swig> {
    let swig = await fetchSwigAccount(connection, swigAddress, config);

    return new Swig(swigAddress, swig);
  }

  async refetch(
    connection: Connection,
    config?: Commitment | GetAccountInfoConfig,
  ) {
    let swig = await fetchSwigAccount(connection, this.address, config);
    this.account = swig;
  }

  static fromRawAccountData(swigAddress: PublicKey, accountData: Uint8Array) {
    let swigAccount = getSwigCodec().decode(accountData);
    return new Swig(swigAddress, swigAccount);
  }

  static create(args: {
    payer: PublicKey;
    id: Uint8Array;
    startSlot: bigint;
    endSlot: bigint;
    authority: Authority;
  }) {
    let [address, bump] = findSwigPda(args.id);
    return args.authority.create({
      payer: args.payer,
      swigAddress: address,
      bump,
      endSlot: args.endSlot,
      startSlot: args.startSlot,
      id: args.id,
    });
  }

  findRoleByAuthority(authority: Authority) {
    return this.roles.find((role) => role.authority.isEqual(authority)) ?? null;
  }

  findRoleById(id: number) {
    return this.roles.find(role => role.id === id) ?? null;
  }
}

export class SwigRole {
  private readonly actions: SwigActions;

  constructor(
    private readonly role: Role,
    public readonly swigAddress: PublicKey,
    public readonly id: number,
  ) {
    this.actions = new SwigActions(this.role.actions);
  }

  get authority(): Authority {
    return new Authority(
      new Uint8Array(this.role.authorityData),
      this.role.authorityType,
    );
  }

  /**
   *
   * @param args
   * @returns
   */
  sign(args: {
    payer: PublicKey;
    innerInstructions: TransactionInstruction[];
  }) {
    return this.authority.sign({
      swigAddress: this.swigAddress,
      payer: args.payer,
      innerInstructions: args.innerInstructions,
      roleId: this.id,
    });
  }

  addAuthority(args: {
    payer: PublicKey;
    actions: SwigActions;
    newAuthority: Authority;
    startSlot: bigint;
    endSlot: bigint;
  }) {
    return this.authority.addAuthority({
      payer: args.payer,
      swigAddress: this.swigAddress,
      actingRoleId: this.id,
      actions: args.actions.rawActions(),
      startSlot: args.startSlot,
      endSlot: args.endSlot,
      newAuthority: args.newAuthority,
    });
  }

  removeAuthority(args: { payer: PublicKey; roleToRemove: SwigRole }) {
    return this.authority.removeAuthority({
      payer: args.payer,
      swigAddress: this.swigAddress,
      roleId: this.id,
      roleIdToRemove: args.roleToRemove.id,
    });
  }

  replaceAuthority(args: {
    payer: PublicKey;
    actions: SwigActions;
    newAuthority: Authority;
    startSlot: bigint;
    endSlot: bigint;
    roleToReplace: SwigRole;
  }) {
    return this.authority.replaceAuthority({
      payer: args.payer,
      swigAddress: this.swigAddress,
      roleId: this.id,
      actions: args.actions.rawActions(),
      roleIdToReplace: args.roleToReplace.id,
      endSlot: args.endSlot,
      startSlot: args.startSlot,
      newAuthority: args.newAuthority,
    });
  }

  hasAllAction() {
    return this.actions.hasAllAction();
  }

  canManageAuthority() {
    return this.actions.canManageAuthority();
  }

  canUseProgram(programId: PublicKey) {
    return this.actions.canUseProgram(programId);
  }

  canSpendSolMax() {
    return this.actions.canSpendSolMax();
  }

  canSpendSol(amount?: bigint) {
    return this.actions.canSpendSol(amount);
  }

  canSpendAllTokensMax() {
    return this.actions.canSpendAllTokensMax();
  }

  canSpendAllTokens(amount?: bigint) {
    return this.actions.canSpendAllTokens(amount);
  }

  canSpendTokenMax(mint: PublicKey) {
    return this.actions.canSpendTokenMax(mint);
  }

  canSpendToken(mint: PublicKey, amount?: bigint) {
    return this.actions.canSpendToken(mint, amount);
  }
}
