import {
  Connection,
  PublicKey,
  type Commitment,
  type GetAccountInfoConfig,
  type TransactionInstruction,
} from '@solana/web3.js';
import {
  Actions,
  getAddAuthorityInstructionContext,
  getCreateSessionInstructionContext,
  getCreateSubAccountInstructionContext,
  getRemoveAuthorityInstructionContext,
  getSignInstructionContext,
  getToggleSubAccountInstructionContext,
  getWithdrawFromSubAccountInstructionContext,
  SolInstruction,
  Swig,
  SwigInstructionContext,
  type CreateAuthorityInfo,
  type RoleInfo,
  type SigningFn,
  type Web3Instruction,
  type WithdrawSubAccountArgs,
} from '@swig-wallet/lib';
import { fetchMaybeSwigAccount, fetchSwigAccount } from './accounts';

export async function getAddAuthorityInstructions(
  swig: Swig,
  roleInfo: RoleInfo,
  newAuthorityInfo: CreateAuthorityInfo,
  actions: Actions,
  options?: SwigOptions,
): Promise<TransactionInstruction[]> {
  const context = await getAddAuthorityInstructionContext(
    swig,
    roleInfo,
    newAuthorityInfo,
    actions,
    options,
  );

  return getInstructionsFromContext(context);
}

export async function getRemoveAuthorityInstructions(
  swig: Swig,
  roleInfo: RoleInfo,
  roleToRemoveInfo: RoleInfo,
  options?: SwigOptions,
): Promise<TransactionInstruction[]> {
  const context = await getRemoveAuthorityInstructionContext(
    swig,
    roleInfo,
    roleToRemoveInfo,
    options,
  );

  return getInstructionsFromContext(context);
}

export async function getSignInstructions(
  swig: Swig,
  roleInfo: RoleInfo,
  instructions: TransactionInstruction[],
  withSubAccount?: boolean,
  options?: SwigOptions,
): Promise<TransactionInstruction[]> {
  const context = await getSignInstructionContext(
    swig,
    roleInfo,
    instructions.map(SolInstruction.from),
    withSubAccount,
    options,
  );

  return getInstructionsFromContext(context);
}

export async function getCreateSessionInstructions(
  swig: Swig,
  roleInfo: RoleInfo,
  sessionKey: PublicKey,
  duration?: bigint,
  options?: SwigOptions,
): Promise<TransactionInstruction[]> {
  const context = await getCreateSessionInstructionContext(
    swig,
    roleInfo,
    sessionKey,
    duration,
    options,
  );

  return getInstructionsFromContext(context);
}

export async function getCreateSubAccountInstructions(
  swig: Swig,
  roleInfo: RoleInfo,
  options?: SwigOptions,
): Promise<TransactionInstruction[]> {
  const context = await getCreateSubAccountInstructionContext(
    swig,
    roleInfo,
    options,
  );

  return getInstructionsFromContext(context);
}

export async function getToggleSubAccountInstructions(
  swig: Swig,
  roleInfo: RoleInfo,
  enabled: boolean,
  options?: SwigOptions,
): Promise<TransactionInstruction[]> {
  const context = await getToggleSubAccountInstructionContext(
    swig,
    roleInfo,
    enabled,
    options,
  );

  return getInstructionsFromContext(context);
}

export async function getWithdrawFromSubAccountSubAccountInstructions(
  swig: Swig,
  roleInfo: RoleInfo,
  withdrawArgs: WithdrawSubAccountArgs<PublicKey>,
  options?: SwigOptions,
): Promise<TransactionInstruction[]> {
  const context = await getWithdrawFromSubAccountInstructionContext(
    swig,
    roleInfo,
    withdrawArgs,
    options,
  );

  return getInstructionsFromContext(context);
}

export async function fetchNullableSwig(
  connection: Connection,
  swigAddress: PublicKey,
  config?: Commitment | GetAccountInfoConfig,
): Promise<Swig | null> {
  const maybeSwig = await fetchMaybeSwigAccount(
    connection,
    swigAddress,
    config,
  );
  if (!maybeSwig) {
    return null;
  }
  return new Swig(swigAddress, maybeSwig);
}

/**
 * Fetch a Swig. Throws an error if Swig account has not been created
 * @param connection Connection
 * @param swigAddress Swig address
 * @param config Commitment config
 * @returns Swig | null
 */
export async function fetchSwig(
  connection: Connection,
  swigAddress: PublicKey,
  config?: Commitment | GetAccountInfoConfig,
): Promise<Swig> {
  const swig = await fetchSwigAccount(connection, swigAddress, config);

  return new Swig(swigAddress, swig);
}

export function getTransactionInstructionFromWeb3Instruction(
  ix: Web3Instruction,
): TransactionInstruction {
  return {
    programId: new PublicKey(ix.programId.toBytes()),
    keys: ix.keys.map((meta) => ({
      isSigner: meta.isSigner,
      isWritable: meta.isWritable,
      pubkey: new PublicKey(meta.pubkey.toBytes()),
    })),
    data: Buffer.from(ix.data),
  };
}

export function getInstructionsFromContext(
  swigContext: SwigInstructionContext,
): TransactionInstruction[] {
  return swigContext
    .getWeb3Instructions()
    .map(getTransactionInstructionFromWeb3Instruction);
}

export type SwigOptions = {
  signningFn?: SigningFn;
  currentSlot?: bigint;
  payer?: PublicKey;
};
