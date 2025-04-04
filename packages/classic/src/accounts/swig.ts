import type {
  Commitment,
  Connection,
  GetAccountInfoConfig,
  PublicKey,
} from '@solana/web3.js';
import { getSwigCodec, type SwigAccount } from '@swig/coder';

export async function fetchMaybeSwigAccount(
  connection: Connection,
  swigAddress: PublicKey,
  config?: Commitment | GetAccountInfoConfig,
): Promise<SwigAccount | null> {
  const accountInfo = await connection.getAccountInfo(swigAddress, config);
  if (!accountInfo) return accountInfo;
  return getSwigCodec().decode(accountInfo.data);
}

export async function fetchSwigAccount(
  connection: Connection,
  swigAddress: PublicKey,
  config?: Commitment | GetAccountInfoConfig,
): Promise<SwigAccount> {
  const maybeSwig = await fetchMaybeSwigAccount(connection, swigAddress, config);
  if (!maybeSwig) throw new Error('Unable to fetch Swig account');
  return maybeSwig;
}
