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
  createSecp256k1SessionAuthorityInfo,
  findSwigPda,
  getCreateSwigInstruction,
  getSignInstructions,
  fetchSwig,
  getSigningFnForSecp256k1PrivateKey,
  getCreateSessionInstructions,
} from '@swig-wallet/kit';

import { Wallet } from '@ethereumjs/wallet';
import { sleepSync } from 'bun';

async function sendAndConfirmTransactionWithLogs(
  connection: {
    rpc: ReturnType<typeof createSolanaRpc>;
    rpcSubscriptions: ReturnType<typeof createSolanaRpcSubscriptions>;
  },
  instructions: IInstruction[],
  payer: KeyPairSigner,
  label: string,
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

  const sig = getSignatureFromTransaction(signedTransaction).toString();
  console.log(`🔗 ${label}: https://explorer.solana.com/tx/${sig}?cluster=custom`);
  return sig;
}

(async () => {
  console.log('⏳ Starting on local validator...');

  // RPC Setup
  const rpc = createSolanaRpc('http://127.0.0.1:8899');
  const rpcSubscriptions = createSolanaRpcSubscriptions('ws://127.0.0.1:8900');
  const connection = { rpc, rpcSubscriptions };

  // Generate wallets and keypairs
  const userWallet = Wallet.generate();
  const userRootKeypair = await generateKeyPairSigner();
  const dappSessionKeypair = await generateKeyPairSigner();
  const dappTreasury = await generateKeyPairSigner();

  const id = Uint8Array.from(Array(32).fill(0));
  const swigAddress = await findSwigPda(id);

  // Airdrop SOL
  for (const keypair of [userRootKeypair, dappSessionKeypair]) {
    await rpc.requestAirdrop(keypair.address, lamports(1_000_000_000n)).send();
  }

  sleepSync(3000); // Wait for airdrops

  // Create Swig
  const rootActions = Actions.set().all().get();

  // Create authority info with session capability (need to use the single role pattern from classic)
  const authorityInfo = createSecp256k1SessionAuthorityInfo(
    userWallet.getPublicKey(),
    100n, // Max session duration
  );

  const createSwigInstruction = await getCreateSwigInstruction({
    authorityInfo,
    id,
    payer: userRootKeypair.address,
    actions: rootActions,
  });

  await sendAndConfirmTransactionWithLogs(
    connection,
    [createSwigInstruction],
    userRootKeypair,
    'CreateSwig',
  );

  // Fetch swig
  let swig = await fetchSwig(rpc, swigAddress);

  const rootRole = swig.findRoleById(0);
  if (!rootRole) throw new Error('Root role not found');

  const currentSlot = await rpc.getSlot().send();
  const signingFn = getSigningFnForSecp256k1PrivateKey(userWallet.getPrivateKey());

  // Create session
  console.log('Creating session...');
  const sessionInstructions = await getCreateSessionInstructions(
    swig,
    rootRole.id,
    dappSessionKeypair.address,
    50n, // Session duration in slots
    { 
      payer: userRootKeypair.address,
      currentSlot,
      signingFn,
    },
  );

  await sendAndConfirmTransactionWithLogs(
    connection,
    sessionInstructions,
    userRootKeypair,
    'CreateSession',
  );
  console.log('✅ Session created');

  // Refetch swig and get session role
  swig = await fetchSwig(rpc, swigAddress);

  const sessionRole = swig.findRoleBySessionKey(dappSessionKeypair.address);
  if (!sessionRole) throw new Error('Session role not found');

  // Airdrop to swig
  await rpc.requestAirdrop(swigAddress, lamports(1_000_000_000n)).send();
  sleepSync(3000);

  console.log(
    '📦 Swig balance before transfer:',
    (await rpc.getBalance(swigAddress).send()).value,
  );

  // Create transfer instruction
  const transferIx = {
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
        amount: 100_000_000, // 0.1 SOL (matching classic example)
      }),
    ),
  };

  const signTransfer = await getSignInstructions(
    swig,
    sessionRole.id,
    [transferIx],
    false,
    {
      payer: dappSessionKeypair.address,
      currentSlot,
      signingFn,
    },
  );

  try {
    await sendAndConfirmTransactionWithLogs(
      connection,
      signTransfer,
      dappSessionKeypair,
      'TransferSOL',
    );
  } catch (err) {
    console.error('🚨 Transaction failed:', err);
    return;
  }

  console.log(
    '✅ Swig balance after transfer:',
    (await rpc.getBalance(swigAddress).send()).value,
  );
})();
