import type {
  Address,
  FetchAccountConfig,
  GetAccountInfoApi,
  Rpc,
} from '@solana/kit';
import {
  Actions,
  getAddAuthorityInstructionContext,
  getCreateSessionInstructionContext,
  getCreateSubAccountInstructionContext,
  getCreateSwigInstructionContext,
  getRemoveAuthorityInstructionContext,
  getSignInstructionContext,
  getToggleSubAccountInstructionContext,
  getWithdrawFromSubAccountInstructionContext,
  SolInstruction,
  Swig,
  SwigInstructionContext,
  type CreateAuthorityInfo,
  type KitInstruction,
  type SigningFn,
  type WithdrawSubAccountArgs,
} from '@swig-wallet/lib';
import { fetchMaybeSwigAccount, fetchSwigAccount } from './accounts';

export async function getCreateSwigInstruction(args: {
  payer: Address;
  id: Uint8Array;
  actions: Actions;
  authorityInfo: CreateAuthorityInfo;
}): Promise<KitInstruction> {
  const context = await getCreateSwigInstructionContext(args);
  return getInstructionsFromContext(context)[0];
}

export async function getAddAuthorityInstructions(
  swig: Swig,
  roleId: number,
  newAuthorityInfo: CreateAuthorityInfo,
  actions: Actions,
  options?: SwigOptions,
): Promise<KitInstruction[]> {
  const context = await getAddAuthorityInstructionContext(
    swig,
    roleId,
    newAuthorityInfo,
    actions,
    options,
  );

  return getInstructionsFromContext(context);
}

export async function getRemoveAuthorityInstructions(
  swig: Swig,
  roleId: number,
  roleToRemoveId: number,
  options?: SwigOptions,
): Promise<KitInstruction[]> {
  const context = await getRemoveAuthorityInstructionContext(
    swig,
    roleId,
    roleToRemoveId,
    options,
  );

  return getInstructionsFromContext(context);
}

export async function getSignInstructions(
  swig: Swig,
  roleId: number,
  instructions: KitInstruction[],
  withSubAccount?: boolean,
  options?: SwigOptions,
): Promise<KitInstruction[]> {
  const context = await getSignInstructionContext(
    swig,
    roleId,
    instructions.map(SolInstruction.from),
    withSubAccount,
    options,
  );

  return getInstructionsFromContext(context);
}

export async function getCreateSessionInstructions(
  swig: Swig,
  roleId: number,
  sessionKey: Address,
  duration?: bigint,
  options?: SwigOptions,
): Promise<KitInstruction[]> {
  const context = await getCreateSessionInstructionContext(
    swig,
    roleId,
    sessionKey,
    duration,
    options,
  );

  return getInstructionsFromContext(context);
}

export async function getCreateSubAccountInstructions(
  swig: Swig,
  roleId: number,
  options?: SwigOptions,
): Promise<KitInstruction[]> {
  const context = await getCreateSubAccountInstructionContext(
    swig,
    roleId,
    options,
  );

  return getInstructionsFromContext(context);
}

export async function getToggleSubAccountInstructions(
  swig: Swig,
  roleId: number,
  enabled: boolean,
  options?: SwigOptions,
): Promise<KitInstruction[]> {
  const context = await getToggleSubAccountInstructionContext(
    swig,
    roleId,
    enabled,
    options,
  );

  return getInstructionsFromContext(context);
}

export async function getWithdrawFromSubAccountSubAccountInstructions(
  swig: Swig,
  roleId: number,
  withdrawArgs: WithdrawSubAccountArgs<Address>,
  options?: SwigOptions,
): Promise<KitInstruction[]> {
  const context = await getWithdrawFromSubAccountInstructionContext(
    swig,
    roleId,
    withdrawArgs,
    options,
  );

  return getInstructionsFromContext(context);
}

export async function fetchNullableSwig(
  rpc: Rpc<GetAccountInfoApi>,
  swigAddress: Address,
  config?: FetchAccountConfig,
): Promise<Swig | null> {
  const maybeSwig = await fetchMaybeSwigAccount(rpc, swigAddress, config);
  if (!maybeSwig.exists) {
    return null;
  }
  return new Swig(swigAddress, maybeSwig.data);
}

/**
 * Fetch a Swig. Throws an error if Swig account has not been created
 * @param connection Connection
 * @param swigAddress Swig address
 * @param config Commitment config
 * @returns Swig | null
 */
export async function fetchSwig(
  rpc: Rpc<GetAccountInfoApi>,
  swigAddress: Address,
  config?: FetchAccountConfig,
): Promise<Swig> {
  const swig = await fetchSwigAccount(rpc, swigAddress, config);

  return new Swig(swigAddress, swig.data);
}

export function getInstructionsFromContext(
  swigContext: SwigInstructionContext,
): KitInstruction[] {
  return swigContext.getKitInstructions();
}

export type SwigOptions = {
  signningFn?: SigningFn;
  currentSlot?: bigint;
  payer?: Address;
};
