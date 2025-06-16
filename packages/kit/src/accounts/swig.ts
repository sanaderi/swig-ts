import type { Address, Rpc, SolanaRpcApi } from '@solana/kit';
import { address, assertAccountExists, fetchEncodedAccount } from '@solana/kit';
import { getSwigCodec, type SwigAccount } from '@swig-wallet/coder';

/**
 * Fetches a swig account. Will return `null` if the account is not found
 * @param rpc Kit RPC object
 * @param swigAddress Address of the Swig (string or Address)
 * @returns `SwigAccount` | `null`
 */
export async function fetchMaybeSwigAccount(
  rpc: Rpc<SolanaRpcApi>,
  swigAddress: string | Address,
): Promise<SwigAccount | null> {
  const account = await fetchEncodedAccount(rpc, address(swigAddress));
  if (!account.exists) return null;
  return getSwigCodec().decode(account.data);
}

/**
 * Fetches a swig raw account. Will throw error if account not found
 * @param rpc Kit RPC object
 * @param swigAddress Address of the Swig (string or Address)
 * @returns `SwigAccount`
 */
export async function fetchSwigAccount(
  rpc: Rpc<SolanaRpcApi>,
  swigAddress: string | Address,
): Promise<SwigAccount> {
  const account = await fetchEncodedAccount(rpc, address(swigAddress));
  assertAccountExists(account);
  return getSwigCodec().decode(account.data);
}
