import {
  assertAccountExists,
  assertAccountsExist,
  createSolanaRpc,
  decodeAccount,
  fetchEncodedAccount,
  fetchEncodedAccounts,
  type Account,
  type Address,
  type EncodedAccount,
  type FetchAccountConfig,
  type FetchAccountsConfig,
  type MaybeAccount,
  type MaybeEncodedAccount,
} from '@solana/kit';
import { getSwigCodec, type SwigAccount } from '@swig-wallet/coder';

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
  rpcUrl: string,
  address: Address<TAddress>,
  config?: FetchAccountConfig,
): Promise<Account<SwigAccount, TAddress>> {
  const maybeAccount = await fetchMaybeSwigAccount(rpcUrl, address, config);
  assertAccountExists(maybeAccount);
  return maybeAccount;
}

export async function fetchMaybeSwigAccount<TAddress extends string = string>(
  rpcUrl: string,
  address: Address<TAddress>,
  config?: FetchAccountConfig,
): Promise<MaybeAccount<SwigAccount, TAddress>> {
  const rpc = createSolanaRpc(rpcUrl)
  const maybeAccount = await fetchEncodedAccount(rpc, address, config);
  return decodeSwig(maybeAccount);
}

export async function fetchAllSwigAccounts(
  rpcUrl: string,
  addresses: Array<Address>,
  config?: FetchAccountsConfig,
): Promise<Account<SwigAccount>[]> {
  const maybeAccounts = await fetchAllMaybeSwigAccounts(rpcUrl, addresses, config);
  assertAccountsExist(maybeAccounts);
  return maybeAccounts;
}

export async function fetchAllMaybeSwigAccounts(
  rpcUrl: string,
  addresses: Array<Address>,
  config?: FetchAccountsConfig,
): Promise<MaybeAccount<SwigAccount>[]> {
  const rpc = createSolanaRpc(rpcUrl)
  const maybeAccounts = await fetchEncodedAccounts(rpc, addresses, config);
  return maybeAccounts.map((maybeAccount) => decodeSwig(maybeAccount));
}
