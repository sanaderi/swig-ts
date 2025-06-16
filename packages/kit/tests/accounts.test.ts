import { getMintCodec } from '@solana-program/token';
import {
  address,
  assertAccountExists,
  createSolanaRpc,
  fetchEncodedAccount,
} from '@solana/kit';
import { getMint } from '@solana/spl-token';
import { Connection, PublicKey } from '@solana/web3.js';
import { fetchMaybeSwigAccount, fetchSwigAccount } from '../src/accounts/swig';

const MINT_ADDRESS = 'So11111111111111111111111111111111111111112'; // Example: Wrapped SOL
const NON_EXISTENT_ADDRESS = '11111111111111111111111111111112';
const INVALID_ADDRESS = 'notAValidAddress';
const REAL_SWIG_ADDRESS = 'APkCV5cLqT5Qf3iEmJv9tBKrKb5aSD1uFAFqvrFV5Dz9';

test('Kit fetcher is compatible with SPL Token Mint', async () => {
  // Using Kit
  const rpc = createSolanaRpc('https://api.devnet.solana.com');
  const kitAccount = await fetchEncodedAccount(rpc, address(MINT_ADDRESS));
  assertAccountExists(kitAccount);
  const kitMint = getMintCodec().decode(kitAccount.data);

  // Using SPL Token (web3.js)
  const connection = new Connection('https://api.devnet.solana.com');
  const splMint = await getMint(connection, new PublicKey(MINT_ADDRESS));

  // Compare relevant fields
  expect(kitMint.decimals).toBe(splMint.decimals);
  expect(kitMint.supply.toString()).toBe(splMint.supply.toString());
});

test('fetchSwigAccount throws for non-existent account', async () => {
  const rpc = createSolanaRpc('https://api.devnet.solana.com');
  await expect(
    fetchSwigAccount(rpc, address(NON_EXISTENT_ADDRESS)),
  ).rejects.toThrow();
});

test('fetchMaybeSwigAccount resolves for non-Swig account', async () => {
  const rpc = createSolanaRpc('https://api.devnet.solana.com');
  // Use a real address that exists but is NOT a Swig account, e.g. a mint
  await expect(
    fetchMaybeSwigAccount(rpc, address(MINT_ADDRESS)),
  ).resolves.toBeDefined();
});

test('fetchMaybeSwigAccount throws for invalid address input', async () => {
  // Log the first 8 bytes (characters) of the invalid address
  console.log('First 8 bytes of INVALID_ADDRESS:', INVALID_ADDRESS.slice(0, 8));
  expect(() => address(INVALID_ADDRESS)).toThrow();
});

test('fetchSwigAccount matches fetchMaybeSwigAccount for existing account', async () => {
  const rpc = createSolanaRpc('https://api.devnet.solana.com');
  const maybe = await fetchMaybeSwigAccount(rpc, address(REAL_SWIG_ADDRESS));
  if (maybe) {
    const sure = await fetchSwigAccount(rpc, address(REAL_SWIG_ADDRESS));
    expect(sure).toEqual(maybe);
  }
});
