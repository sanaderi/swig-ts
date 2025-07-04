import { assertAccountExists, type FetchAccountConfig } from '@solana/kit';
import { getSwigCodec, type SwigAccount } from '@swig-wallet/coder';
import { fetchMaybeSwigAccount, fetchSwigAccount } from '../accounts';
import { type Actions } from '../actions';
import {
  isEd25519BasedAuthority,
  type CreateAuthorityInfo,
  type SigningFn,
} from '../authority';
import { createSwigInstruction } from '../instructions';
import {
  deserializeRoles,
  type RoleInfo,
  type SessionBasedRole,
} from '../role';
import {
  SolanaPublicKey,
  SolInstruction,
  type SolanaPublicKeyData,
} from '../schema';
import { findSwigSubAccountPda, getUnprefixedSecpBytes } from '../utils';

export class Swig {
  private constructor(
    public readonly address: SolanaPublicKey,
    private account: SwigAccount,
    public rpcUrl: string,
  ) {}

  /**
   * Swig ID
   */
  get id() {
    return this.account.id;
  }

  /**
   * Roles on the swig
   */
  get roles() {
    return deserializeRoles(
      this.address,
      Uint8Array.from(this.account.roles_buffer),
      this.account.roles,
      Uint8Array.from(this.account.id),
    );
  }

  /**
   * Fetch a Swig. Returns null if Swig account has not been created
   * @param connection Connection
   * @param swigAddress Swig address
   * @param config Commitment config
   * @returns Swig | null
   */
  static async fetchNullable(
    rpcUrl: string,
    swigAddress: SolanaPublicKey,
    config?: FetchAccountConfig,
  ): Promise<Swig | null> {
    const maybeSwig = await fetchMaybeSwigAccount(
      rpcUrl,
      swigAddress.toAddress(),
      config,
    );
    if (!maybeSwig.exists) {
      return null;
    }
    assertAccountExists(maybeSwig);
    return new Swig(swigAddress, maybeSwig.data, rpcUrl);
  }

  /**
   * Fetch a Swig. Throws an error if Swig account has not been created
   * @param connection Connection
   * @param swigAddress Swig address
   * @param config Commitment config
   * @returns Swig | null
   */
  static async fetch(
    rpcUrl: string,
    swigAddress: SolanaPublicKey,
    config?: FetchAccountConfig,
  ): Promise<Swig> {
    const swig = await fetchSwigAccount(
      rpcUrl,
      swigAddress.toAddress(),
      config,
    );

    return new Swig(swigAddress, swig.data, rpcUrl);
  }

  setRpcUrl = (rpcUrl: string) => {
    this.rpcUrl = rpcUrl;
  };

  /**
   * Refetch the swig to invalidate stale account data.
   * Updates the Swig with the lateset on-chain state
   * @param connection Connection
   * @param config Connection config
   */
  refetch = async (config?: FetchAccountConfig) => {
    if (!this.rpcUrl)
      throw new Error('Failed to refetch swig. RPC url not set');
    const swig = await fetchSwigAccount(
      this.rpcUrl,
      this.address.toAddress(),
      config,
    );
    this.account = swig.data;
  };

  /**
   * Get a swig from raw swig account data
   * @param swigAddress Swig address
   * @param accountData Raw account data
   * @returns Swig
   */
  static fromRawAccountData(
    swigAddress: SolanaPublicKey,
    accountData: Uint8Array,
  ) {
    const swigAccount = getSwigCodec().decode(accountData);
    return new Swig(swigAddress, swigAccount, '');
  }

  //////////////////////////////////////////////
  //
  // Instructions
  //
  //////////////////////////////////////////////

  /**
   * Get `Create` instruction for creating a new Swig
   * @param args
   * @param args.payer Swig payer
   * @param args.id Swig ID
   * @returns Instruction for creating a Swig
   */
  static create(args: {
    payer: SolanaPublicKeyData;
    id: Uint8Array;
    actions: Actions;
    authorityInfo: CreateAuthorityInfo;
  }) {
    return createSwigInstruction(
      { payer: new SolanaPublicKey(args.payer) },
      {
        id: args.id,
        actions: args.actions.bytes(),
        authorityData: args.authorityInfo.data,
        authorityType: args.authorityInfo.type,
        noOfActions: args.actions.count,
      },
    );
  }

  addAuthorityInstruction = async (
    actingRoleInfo: RoleInfo,
    newAuthorityInfo: CreateAuthorityInfo,
    actions: Actions,
    options?: SwigOptions,
  ) => {
    const { payer, role } = await this.#assertInstructionOptions(
      actingRoleInfo.id,
      options,
    );

    return role.authority.addAuthority({
      actingRoleId: role.id,
      actions,
      newAuthorityInfo,
      payer,
      swigAddress: this.address,
      options,
    });
  };

  removeAuthorityInstruction = async (
    actingRoleInfo: RoleInfo,
    roleToRemoveInfo: RoleInfo,
    options?: SwigOptions,
  ) => {
    const { payer, role } = await this.#assertInstructionOptions(
      actingRoleInfo.id,
      options,
    );

    return role.authority.removeAuthority({
      roleId: role.id,
      roleIdToRemove: roleToRemoveInfo.id,
      payer,
      swigAddress: this.address,
      options,
    });
  };

  signInstruction = async (
    roleInfo: RoleInfo,
    innerInstructions: SolInstruction[],
    options?: SwigOptions,
  ) => {
    const { payer, role } = await this.#assertInstructionOptions(
      roleInfo.id,
      options,
    );

    return role.authority.sign({
      roleId: role.id,
      innerInstructions,
      payer,
      swigAddress: this.address,
      options,
    });
  };

  createSessionInstruction = async (
    roleInfo: RoleInfo,
    sessionKey: SolanaPublicKeyData,
    duration?: bigint,
    options?: SwigOptions,
  ) => {
    const { payer, role } = await this.#assertInstructionOptions(
      roleInfo.id,
      options,
    );

    if (!role.isSessionBased()) {
      throw new Error(
        `Cannot create session for Role Id: ${roleInfo.id}. Role is not a session-based`,
      );
    }

    return role.authority.createSession({
      roleId: role.id,
      newSessionKey: new SolanaPublicKey(sessionKey),
      payer,
      swigAddress: this.address,
      sessionDuration: duration,
      options,
    });
  };

  createSubAccountInstruction = async (
    roleInfo: RoleInfo,
    options?: SwigOptions,
  ) => {
    const { payer, role } = await this.#assertInstructionOptions(
      roleInfo.id,
      options,
    );

    return role.authority.subAccountCreate({
      swigAddress: role.swigAddress,
      swigId: role.swigId,
      payer,
      roleId: role.id,
      options,
    });
  };

  toggleSubAccountInstruction = async (
    roleInfo: RoleInfo,
    enabled: boolean,
    options?: SwigOptions,
  ) => {
    const { payer, role } = await this.#assertInstructionOptions(
      roleInfo.id,
      options,
    );

    return role.authority.subAccountToggle({
      swigAddress: role.swigAddress,
      subAccount: new SolanaPublicKey(
        (await findSwigSubAccountPda(role.swigId, role.id))[0],
      ),
      payer,
      roleId: role.id,
      options,
      enabled,
    });
  };

  withdrawFromSubAccountInstruction = async (
    roleInfo: RoleInfo,
    args:
      | { amount: bigint }
      | {
          amount: bigint;
          mint: SolanaPublicKeyData;
          tokenProgram?: SolanaPublicKeyData;
        },
    options?: SwigOptions,
  ) => {
    const { payer, role } = await this.#assertInstructionOptions(
      roleInfo.id,
      options,
    );

    const subAccount = new SolanaPublicKey(
      (await findSwigSubAccountPda(role.swigId, role.id))[0],
    );
    return 'mint' in args
      ? role.authority.subAccountWithdrawToken({
          swigAddress: role.swigAddress,
          subAccount,
          payer,
          roleId: role.id,
          options,
          amount: args.amount,
          mint: new SolanaPublicKey(args.mint),
          tokenProgram: args.tokenProgram
            ? new SolanaPublicKey(args.tokenProgram)
            : undefined,
        })
      : role.authority.subAccountWithdrawSol({
          swigAddress: role.swigAddress,
          subAccount,
          payer,
          roleId: role.id,
          options,
          amount: args.amount,
        });
  };

  //////////////////////////////////////////////
  //
  // Queries
  //
  //////////////////////////////////////////////

  /**
   * Find a Role by a Role ID
   * @param id Role ID
   * @returns Role | null
   */
  findRoleById = async (id: number, options?: { prefetch?: boolean }) => {
    if (options?.prefetch) {
      await this.refetch();
    }
    const role = this.roles.find((role) => role.id === id) ?? null;
    if (!role) {
      throw new Error(`Role not found for ID: ${id}`);
    }
    return role;
  };

  /**
   * Find a {@link Role} by session key
   * @param sessionKey
   * @returns Session-based Role
   */
  findRoleBySessionKey = async (
    sessionKey: SolanaPublicKey,
    options?: { prefetch?: boolean },
  ): Promise<SessionBasedRole | null> => {
    if (options?.prefetch) {
      await this.refetch();
    }
    const role = this.roles.find(
      (r) =>
        r.isSessionBased() &&
        r.authority.sessionKey.toBase58() === sessionKey.toBase58(),
    );
    if (!role) return null;
    return role as SessionBasedRole;
  };

  /**
   * Find a Role by Authority Signer
   * @param signer Authority signer
   * @returns Role[]
   */
  findRolesByAuthoritySigner = async (
    signer: Uint8Array,
    options?: { prefetch?: boolean },
  ) => {
    if (options?.prefetch) {
      await this.refetch();
    }
    return this.roles
      .filter((role) => role.authority.matchesSigner(signer))
      .map((role) => role.info());
  };

  /**
   * Find a Role by Ed25519 Signer Publickey
   * @param signerPk Ed25519 Publickey
   * @returns Role[]
   */
  findRolesByEd25519SignerPk = async (
    signerPk: SolanaPublicKeyData,
    options?: { prefetch?: boolean },
  ) => {
    return this.findRolesByAuthoritySigner(
      new SolanaPublicKey(signerPk).toBytes(),
      options,
    );
  };

  /**
   * Find a Role by Authority Signer
   * @param signerAddress Secp256k1 Signer Address hex or bytes
   * @returns Role[]
   */
  findRolesBySecp256k1SignerAddress = async (
    signerAddress: Uint8Array | string,
    options?: { prefetch?: boolean },
  ) => {
    return this.findRolesByAuthoritySigner(
      getUnprefixedSecpBytes(signerAddress, 20),
      options,
    );
  };

  #assertInstructionOptions = async (roleId: number, options?: SwigOptions) => {
    if (options?.prefetch) {
      await this.refetch();
    }

    const role = await this.findRoleById(roleId);

    if (!isEd25519BasedAuthority(role.authority) || !options?.payer) {
      throw new Error('payer not provided for non-ed25519 based authority');
    }

    const payer = new SolanaPublicKey(options.payer ?? role.authority.id);

    return { payer, role };
  };
}

export type SwigOptions = {
  prefetch?: boolean;
  signningFn?: SigningFn;
  currentSlot?: bigint;
  payer?: SolanaPublicKeyData;
};
