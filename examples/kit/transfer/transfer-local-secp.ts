import {
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  generateKeyPairSigner,
  sendAndConfirmTransactionFactory,
  getSignatureFromTransaction,
  createTransactionMessage,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstructions,
  signTransactionMessageWithSigners,
  pipe,
  lamports,
  AccountRole,
  type IInstruction,
  type KeyPairSigner,
} from '@solana/kit';

import {
  getTransferSolInstructionDataEncoder,
  SYSTEM_PROGRAM_ADDRESS,
} from '@solana-program/system';

import {
  Actions,
  createSecp256k1AuthorityInfo,
  findSwigPda,
  getCreateSwigInstruction,
  getSignInstructions,
  fetchSwig,
  getSigningFnForSecp256k1PrivateKey,
} from '@swig-wallet/kit';

import { Wallet } from '@ethereumjs/wallet';
import { sleepSync } from 'bun';

console.log('starting...');

// RPC Setup
const rpc = createSolanaRpc('http://localhost:8899');
const rpcSubscriptions = createSolanaRpcSubscriptions('ws://localhost:8900');
const connection = { rpc, rpcSubscriptions };

// EVM Wallet (secp256k1 authority)
const userWallet = Wallet.generate();

// Root payer
const payer = await generateKeyPairSigner();
await rpc.requestAirdrop(payer.address, lamports(1_000_000_000n)).send();

// Transaction signer
const signer = await generateKeyPairSigner();
await rpc.requestAirdrop(signer.address, lamports(1_000_000_000n)).send();

// Dapp treasury (receiver)
const dappTreasury = await generateKeyPairSigner();

sleepSync(3000);

// Swig ID and PDA
const id = Uint8Array.from(Array(32).fill(1));
const swigAddress = await findSwigPda(id);

// Create Swig
const rootActions = Actions.set().all().get();
const createSwigIx = await getCreateSwigInstruction({
  authorityInfo: createSecp256k1AuthorityInfo(userWallet.getPublicKey()),
  id,
  payer: payer.address,
  actions: rootActions,
});
await sendTransaction(connection, [createSwigIx], payer);

// Fund Swig
await rpc.requestAirdrop(swigAddress, lamports(1_000_000_000n)).send();
sleepSync(3000);

// Fetch Swig
const swig = await fetchSwig(rpc, swigAddress);

// Get role
const rootRole = swig.findRolesBySecp256k1SignerAddress(userWallet.getAddress())[0];
if (!rootRole) throw new Error('Role not found for authority');

// Prepare transfer instruction
const transfer = {
  programAddress: SYSTEM_PROGRAM_ADDRESS,
  accounts: [
    {
      address: swigAddress,
      role: AccountRole.WRITABLE_SIGNER,
    },
    {
      address: dappTreasury.address,
      role: AccountRole.WRITABLE,
    },
  ],
  data: new Uint8Array(
    getTransferSolInstructionDataEncoder().encode({
      amount: 100_000_000, // 0.1 SOL
    }),
  ),
} satisfies IInstruction;

console.log(
  'balance before transfer:',
  (await rpc.getBalance(swigAddress).send()).value,
);

// Sign using secp256k1 signer
const currentSlot = await rpc.getSlot().send();
const signingFn = getSigningFnForSecp256k1PrivateKey(userWallet.getPrivateKey());

const signIx = await getSignInstructions(swig, rootRole.id, [transfer], false, {
  payer: signer.address,
  currentSlot,
  signingFn,
});

// Send signed transaction
const txSig = await sendTransaction(connection, signIx, signer);

console.log(`Transfer sent: https://explorer.solana.com/tx/${txSig}?cluster=custom`);

console.log(
  'balance after transfer:',
  (await rpc.getBalance(swigAddress).send()).value,
);

// ---------- Helpers ----------
async function sendTransaction<T extends IInstruction[]>(
  connection: {
    rpc: ReturnType<typeof createSolanaRpc>;
    rpcSubscriptions: ReturnType<typeof createSolanaRpcSubscriptions>;
  },
  instructions: T,
  payer: KeyPairSigner,
): Promise<string> {
  const { value: latestBlockhash } = await connection.rpc
    .getLatestBlockhash()
    .send();

  const transactionMessage = pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayerSigner(payer, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
    (tx) => appendTransactionMessageInstructions(instructions, tx),
  );

  const signedTransaction = await signTransactionMessageWithSigners(
    transactionMessage,
  );

  await sendAndConfirmTransactionFactory(connection as any)(signedTransaction, {
    commitment: 'confirmed',
  });

  return getSignatureFromTransaction(signedTransaction).toString();
}
