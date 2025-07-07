import {
  assertAccountExists,
  assertAccountsExist,
  decodeAccount,
  fetchEncodedAccount,
  fetchEncodedAccounts,
  type Account,
  type Address,
  type Commitment,
  type EncodedAccount,
  type FetchAccountConfig,
  type FetchAccountsConfig,
  type GetAccountInfoApi,
  type GetMultipleAccountsApi,
  type MaybeAccount,
  type MaybeEncodedAccount,
  type Rpc,
} from '@solana/kit';
import { getSwigCodec, type SwigAccount } from '@swig-wallet/coder';
import { SolanaPublicKey, Swig, type SolanaPublicKeyData, type SwigFetchFn } from '@swig-wallet/lib';

export function decodeSwig<TAddress extends string = string>(
  encodedAccount: EncodedAccount<TAddress>,
): Account<SwigAccount, TAddress>;
export function decodeSwig<TAddress extends string = string>(
  encodedAccount: MaybeEncodedAccount<TAddress>,
): MaybeAccount<SwigAccount, TAddress>;
export function decodeSwig<TAddress extends string = string>(
  encodedAccount: EncodedAccount<TAddress> | MaybeEncodedAccount<TAddress>,
): Account<SwigAccount, TAddress> | MaybeAccount<SwigAccount, TAddress> {
  return decodeAccount(
    encodedAccount as MaybeEncodedAccount<TAddress>,
    getSwigCodec(),
  );
}

export async function fetchSwigAccount<TAddress extends string = string>(
  rpc: Rpc<GetAccountInfoApi>,
  address: Address<TAddress>,
  config?: FetchAccountConfig,
): Promise<Account<SwigAccount, TAddress>> {
  const maybeAccount = await fetchMaybeSwigAccount(rpc, address, config);
  assertAccountExists(maybeAccount);
  return maybeAccount;
}

export async function fetchMaybeSwigAccount<TAddress extends string = string>(
  rpc: Rpc<GetAccountInfoApi>,
  address: Address<TAddress>,
  config?: FetchAccountConfig,
): Promise<MaybeAccount<SwigAccount, TAddress>> {
  const maybeAccount = await fetchEncodedAccount(rpc, address, config);
  return decodeSwig(maybeAccount);
}

export async function fetchAllSwigAccounts(
  rpc: Rpc<GetMultipleAccountsApi>,
  addresses: Array<Address>,
  config?: FetchAccountsConfig,
): Promise<Account<SwigAccount>[]> {
  const maybeAccounts = await fetchAllMaybeSwigAccounts(rpc, addresses, config);
  assertAccountsExist(maybeAccounts);
  return maybeAccounts;
}

export async function fetchAllMaybeSwigAccounts(
  rpc: Rpc<GetMultipleAccountsApi>,
  addresses: Array<Address>,
  config?: FetchAccountsConfig,
): Promise<MaybeAccount<SwigAccount>[]> {
  const maybeAccounts = await fetchEncodedAccounts(rpc, addresses, config);
  return maybeAccounts.map((maybeAccount) => decodeSwig(maybeAccount));
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
  return new Swig(swigAddress, maybeSwig.data, getSwigFetchFn(rpc, config));
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

  return new Swig(swigAddress, swig.data, getSwigFetchFn(rpc, config));
}

export const getSwigFetchFn = <T extends { commitment?: Commitment }>(
  connection: Rpc<GetAccountInfoApi>,
  config?: T,
): SwigFetchFn => {
  return async (swigAddress: SolanaPublicKeyData) => {
    const swigPublicKey = new SolanaPublicKey(swigAddress);
    const swigAccount = await fetchSwigAccount(
      connection,
      swigPublicKey.toAddress(),
      config,
    );
    return swigAccount.data;
  };
};
