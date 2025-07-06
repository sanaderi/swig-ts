import { assertAccountExists, type FetchAccountConfig } from '@solana/kit';
import { getSwigCodec, type SwigAccount } from '@swig-wallet/coder';
import { fetchMaybeSwigAccount, fetchSwigAccount } from '../accounts';
import { type Actions } from '../actions';
import {
  isEd25519BasedAuthority,
  type CreateAuthorityInfo,
  type SigningFn,
} from '../authority';
import { createV1SwigInstruction } from '../instructions';
import {
  deserializeRoles,
  type RoleInfo,
  type SessionBasedRole,
} from '../role';
import {
  SolanaPublicKey,
  SolInstruction,
  SwigInstructionContext,
  type SolanaPublicKeyData,
} from '../schema';
import { findSwigSubAccountPda, findSwigSubAccountPdaRaw, getUnprefixedSecpBytes } from '../utils';

export class Swig {
  readonly address: SolanaPublicKey;

  constructor(
    address: SolanaPublicKeyData,
    private account: SwigAccount,
    // public rpcUrl: string,
  ) {
    this.address = new SolanaPublicKey(address);
  }

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
    swigAddress: SolanaPublicKeyData,
    config?: FetchAccountConfig,
  ): Promise<Swig | null> {
    const maybeSwig = await fetchMaybeSwigAccount(
      rpcUrl,
      new SolanaPublicKey(swigAddress).toAddress(),
      config,
    );
    if (!maybeSwig.exists) {
      return null;
    }
    assertAccountExists(maybeSwig);
    return new Swig(new SolanaPublicKey(swigAddress), maybeSwig.data);
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
    swigAddress: SolanaPublicKeyData,
    config?: FetchAccountConfig,
  ): Promise<Swig> {
    const swig = await fetchSwigAccount(
      rpcUrl,
      new SolanaPublicKey(swigAddress).toAddress(),
      config,
    );

    return new Swig(new SolanaPublicKey(swigAddress), swig.data);
  }

  // setRpcUrl = (rpcUrl: string) => {
  //   this.rpcUrl = rpcUrl;
  // };

  // /**
  //  * Refetch the swig to invalidate stale account data.
  //  * Updates the Swig with the lateset on-chain state
  //  * @param connection Connection
  //  * @param config Connection config
  //  */
  // refetch = async (config?: FetchAccountConfig): Promise<Swig> => {
  //   if (!this.rpcUrl)
  //     throw new Error('Failed to refetch swig. RPC url not set');
  //   const swig = await fetchSwigAccount(
  //     this.rpcUrl,
  //     this.address.toAddress(),
  //     config,
  //   );
  //   this.account = swig.data;

  //   return this;
  // };

  /**
   * Get a swig from raw swig account data
   * @param swigAddress Swig address
   * @param accountData Raw account data
   * @returns Swig
   */
  static fromRawAccountData(
    swigAddress: SolanaPublicKeyData,
    accountData: Uint8Array,
  ) {
    const swigAccount = getSwigCodec().decode(accountData);
    return new Swig(swigAddress, swigAccount);
  }

  /**
   * Find a Role by a Role ID
   * @param id Role ID
   * @returns Role | null
   */
  findRoleById = async (id: number) => {
    // if (options?.prefetch) {
    //   await this.refetch();
    // }
    const role = this.roles.find((role) => role.id === id) ?? null;
    if (!role) {
      throw new Error(`Role not found for ID: ${id}`);
    }
    return role;
  };

  // /**
  //  * Find a {@link Role} by session key
  //  * @param sessionKey
  //  * @returns Session-based Role
  //  */
  // findRoleBySessionKey = async (
  //   sessionKey: SolanaPublicKeyData,
  //   options?: { prefetch?: boolean },
  // ): Promise<SessionBasedRole | null> => {
  //   // if (options?.prefetch) {
  //   //   await this.refetch();
  //   // }
  //   return this.findRoleBySessionKeySync(sessionKey);
  // };

  /**
   * Find a {@link Role} by session key
   * @param sessionKey
   * @returns Session-based Role
   */
  findRoleBySessionKey = (
    sessionKey: SolanaPublicKeyData,
  ): SessionBasedRole | null => {
    const role = this.roles.find(
      (r) =>
        r.isSessionBased() &&
        r.authority.sessionKey.toBase58() ===
          new SolanaPublicKey(sessionKey).toBase58(),
    );
    if (!role) return null;
    return role as SessionBasedRole;
  };

  // /**
  //  * Find a Role by Authority Signer
  //  * @param signer Authority signer
  //  * @returns Role[]
  //  */
  // findRolesByAuthoritySigner = async (
  //   signer: Uint8Array,
  //   options?: { prefetch?: boolean },
  // ) => {
  //   if (options?.prefetch) {
  //     await this.refetch();
  //   }
  //   return this.findRolesByAuthoritySignerSync(signer);
  // };

  /**
   * Find a Role by Authority Signer
   * @param signer Authority signer
   * @returns Role[]
   */
  findRolesByAuthoritySigner = (signer: Uint8Array) => {
    return this.roles.filter((role) => role.authority.matchesSigner(signer));
  };

  // /**
  //  * Find a Role by Ed25519 Signer Publickey
  //  * @param signerPk Ed25519 Publickey
  //  * @returns Role[]
  //  */
  // findRolesByEd25519SignerPk = async (
  //   signerPk: SolanaPublicKeyData,
  //   options?: { prefetch?: boolean },
  // ) => {
  //   return this.findRolesByAuthoritySigner(
  //     new SolanaPublicKey(signerPk).toBytes(),
  //     options,
  //   );
  // };

  /**
   * Find a Role by Ed25519 Signer Publickey
   * @param signerPk Ed25519 Publickey
   * @returns Role[]
   */
  findRolesByEd25519SignerPk = (signerPk: SolanaPublicKeyData) => {
    return this.findRolesByAuthoritySigner(
      new SolanaPublicKey(signerPk).toBytes(),
    );
  };

  // /**
  //  * Find a Role by Authority Signer
  //  * @param signerAddress Secp256k1 Signer Address hex or bytes
  //  * @returns Role[]
  //  */
  // findRolesBySecp256k1SignerAddress = async (
  //   signerAddress: Uint8Array | string,
  //   options?: { prefetch?: boolean },
  // ) => {
  //   return this.findRolesByAuthoritySigner(
  //     getUnprefixedSecpBytes(signerAddress, 20),
  //     options,
  //   );
  // };

  findRolesBySecp256k1SignerAddress = (signerAddress: Uint8Array | string) => {
    return this.findRolesByAuthoritySigner(
      getUnprefixedSecpBytes(signerAddress, 20),
    );
  };
}

export const getCreateSwigInstructionContext = (args: {
  payer: SolanaPublicKeyData;
  id: Uint8Array;
  actions: Actions;
  authorityInfo: CreateAuthorityInfo;
}) => {
  return createV1SwigInstruction(
    { payer: new SolanaPublicKey(args.payer) },
    {
      id: args.id,
      actions: args.actions.bytes(),
      authorityData: args.authorityInfo.data,
      authorityType: args.authorityInfo.type,
      noOfActions: args.actions.count,
    },
  );
};

export const getAddAuthorityInstructionContext = async (
  swig: Swig,
  actingRoleInfo: RoleInfo,
  newAuthorityInfo: CreateAuthorityInfo,
  actions: Actions,
  options?: AssertSwigOptions,
): Promise<SwigInstructionContext> => {
  const { payer, role } = await assertInstructionOptions(
    swig,
    actingRoleInfo.id,
    options,
  );

  return role.authority.addAuthority({
    actingRoleId: role.id,
    actions,
    newAuthorityInfo,
    payer,
    swigAddress: swig.address,
    options,
  });
};

export const getRemoveAuthorityInstructionContext = async (
  swig: Swig,
  actingRoleInfo: RoleInfo,
  roleToRemoveInfo: RoleInfo,
  options?: AssertSwigOptions,
) => {
  const { payer, role } = await assertInstructionOptions(
    swig,
    actingRoleInfo.id,
    options,
  );

  return role.authority.removeAuthority({
    roleId: role.id,
    roleIdToRemove: roleToRemoveInfo.id,
    payer,
    swigAddress: swig.address,
    options,
  });
};

export const getSignInstructionContext = async (
  swig: Swig,
  roleInfo: RoleInfo,
  innerInstructions: SolInstruction[],
  withSubAccount?: boolean,
  options?: AssertSwigOptions,
) => {
  const { payer, role } = await assertInstructionOptions(
    swig,
    roleInfo.id,
    options,
  );

  return withSubAccount
    ? role.authority.subAccountSign({
        swigAddress: role.swigAddress,
        subAccount: (await findSwigSubAccountPdaRaw(role.swigId, role.id))[0],
        payer,
        innerInstructions,
        roleId: role.id,
        options,
      })
    : role.authority.sign({
        roleId: role.id,
        innerInstructions,
        payer,
        swigAddress: swig.address,
        options,
      });
};

export const getCreateSessionInstructionContext = async (
  swig: Swig,
  roleInfo: RoleInfo,
  sessionKey: SolanaPublicKeyData,
  duration?: bigint,
  options?: AssertSwigOptions,
) => {
  const { payer, role } = await assertInstructionOptions(
    swig,
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
    swigAddress: swig.address,
    sessionDuration: duration,
    options,
  });
};

export const getCreateSubAccountInstructionContext = async (
  swig: Swig,
  roleInfo: RoleInfo,
  options?: AssertSwigOptions,
) => {
  const { payer, role } = await assertInstructionOptions(
    swig,
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

export const getToggleSubAccountInstructionContext = async (
  swig: Swig,
  roleInfo: RoleInfo,
  enabled: boolean,
  options?: AssertSwigOptions,
) => {
  const { payer, role } = await assertInstructionOptions(
    swig,
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

export const getWithdrawFromSubAccountInstructionContext = async <
  T extends SolanaPublicKeyData = SolanaPublicKeyData,
>(
  swig: Swig,
  roleInfo: RoleInfo,
  args: WithdrawSubAccountArgs<T>,
  options?: AssertSwigOptions,
) => {
  const { payer, role } = await assertInstructionOptions(
    swig,
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

async function assertInstructionOptions(
  swig: Swig,
  roleId: number,
  options?: AssertSwigOptions,
) {
  let _swig = swig;
  if (options?.prefetchFn) {
    _swig = await options.prefetchFn(swig);
  }

  const role = await _swig.findRoleById(roleId);

  if (!isEd25519BasedAuthority(role.authority) && !options?.payer) {
    throw new Error('payer not provided for non-ed25519 based authority');
  }

  const payer = new SolanaPublicKey(options?.payer ?? role.authority.id);

  return { payer, role };
}

type SwigOptions = {
  preFetch?: boolean;
  signningFn?: SigningFn;
  currentSlot?: bigint;
  payer?: SolanaPublicKeyData;
};

type AssertSwigOptions = Omit<SwigOptions, 'preFetch'> & {
  prefetchFn?: (swig: Swig) => Promise<Swig>;
};

export type WithdrawSubAccountArgs<T extends SolanaPublicKeyData> =
  | { amount: bigint }
  | {
      amount: bigint;
      mint: T;
      tokenProgram?: T;
    };
