import { getMintCodec } from '@solana-program/token';
import {
  address,
  assertAccountExists,
  createSolanaRpc,
  fetchEncodedAccount,
} from '@solana/kit';
import { getMint } from '@solana/spl-token';
import { Connection, PublicKey } from '@solana/web3.js';

const MINT_ADDRESS = 'So11111111111111111111111111111111111111112'; // Example: Wrapped SOL

test('Kit fetcher is compatible with SPL Token Mint', async () => {
  // Using Kit
  const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
  const kitAccount = await fetchEncodedAccount(rpc, address(MINT_ADDRESS));
  assertAccountExists(kitAccount);
  const kitMint = getMintCodec().decode(kitAccount.data);

  // Using SPL Token (web3.js)
  const connection = new Connection('https://api.mainnet-beta.solana.com');
  const splMint = await getMint(connection, new PublicKey(MINT_ADDRESS));

  // Compare relevant fields
  expect(kitMint.decimals).toBe(splMint.decimals);
  expect(kitMint.supply.toString()).toBe(splMint.supply.toString());
  // ...add more field comparisons as needed
});
