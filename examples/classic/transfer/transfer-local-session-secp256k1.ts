import { Wallet } from '@ethereumjs/wallet';
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
  SendTransactionError,
} from '@solana/web3.js';
import {
  Actions,
  createSecp256k1SessionAuthorityInfo,
  findSwigPda,
  getCreateSessionInstructions,
  getCreateSwigInstruction,
  getSigningFnForSecp256k1PrivateKey,
  getSignInstructions,
  Swig,
  type InstructionDataOptions,
} from '@swig-wallet/classic';

async function sendAndConfirmTransactionWithLogs(
  connection: Connection,
  instructions: TransactionInstruction[],
  signers: Keypair[],
  label: string,
) {
  const tx = new Transaction().add(...instructions);
  tx.feePayer = signers[0].publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx.sign(...signers);

  const sig = await sendAndConfirmTransaction(connection, tx, signers, {
    commitment: 'confirmed',
  });

  console.log(`🔗 ${label}: https://explorer.solana.com/tx/${sig}?cluster=custom`);
  return sig;
}

(async () => {
  const connection = new Connection('http://127.0.0.1:8899', 'confirmed');
  console.log('⏳ Starting on local validator...');

  const userWallet = Wallet.generate();
  const userRootKeypair = Keypair.generate();
  const dappSessionKeypair = Keypair.generate();
  const dappTreasury = Keypair.generate().publicKey;

  const id = Uint8Array.from(Array(32).fill(0));
  const swigAddress = findSwigPda(id);

  // Airdrop SOL
  for (const keypair of [userRootKeypair, dappSessionKeypair]) {
    const sig = await connection.requestAirdrop(
      keypair.publicKey,
      LAMPORTS_PER_SOL,
    );
    await connection.confirmTransaction(sig, 'confirmed');
  }

  // Create Swig
  const rootActions = Actions.set().all().get();
  const createSwigInstruction = await getCreateSwigInstruction({
    authorityInfo: createSecp256k1SessionAuthorityInfo(
      userWallet.getPublicKey(),
      100n,
    ),
    id,
    payer: userRootKeypair.publicKey,
    actions: rootActions,
  });

  await sendAndConfirmTransactionWithLogs(
    connection,
    [createSwigInstruction],
    [userRootKeypair],
    'CreateSwig',
  );

  // Fetch swig
  const swigAccount = await connection.getAccountInfo(swigAddress);
  if (!swigAccount) throw new Error('Swig not created');
  let swig = Swig.fromRawAccountData(swigAddress, swigAccount.data);

  const rootRole = swig.findRoleById(0);
  if (!rootRole) throw new Error('Root role not found');

  const currentSlot = await connection.getSlot('confirmed');
  const signingFn = getSigningFnForSecp256k1PrivateKey(
    userWallet.getPrivateKeyString(),
  );

  const instOptions: InstructionDataOptions = {
    currentSlot: BigInt(currentSlot),
    signingFn,
  };

  // Create session
  const sessionInstructions = await getCreateSessionInstructions(
    swig,
    rootRole.id,
    dappSessionKeypair.publicKey,
    50n,
    { ...instOptions, payer: userRootKeypair.publicKey },
  );

  if (!sessionInstructions) throw new Error('Missing session instructions');

  await sendAndConfirmTransactionWithLogs(
    connection,
    sessionInstructions,
    [userRootKeypair],
    'CreateSession',
  );

  // Refetch swig and get role
  const updatedSwigAccount = await connection.getAccountInfo(swigAddress);
  swig = Swig.fromRawAccountData(swigAddress, updatedSwigAccount!.data);

  const sessionRole = swig.findRoleBySessionKey(dappSessionKeypair.publicKey);
  if (!sessionRole) throw new Error('Session role not found');

  // Airdrop to swig
  const sig = await connection.requestAirdrop(
    swigAddress,
    LAMPORTS_PER_SOL,
  );
  await connection.confirmTransaction(sig, 'confirmed');

  console.log(
    '📦 Swig balance before transfer:',
    await connection.getBalance(swigAddress),
  );

  // Create transfer instruction
  const transferIx = SystemProgram.transfer({
    fromPubkey: swigAddress,
    toPubkey: dappTreasury,
    lamports: 0.1 * LAMPORTS_PER_SOL,
  });

  const signTransfer = await getSignInstructions(
    swig,
    sessionRole.id,
    [transferIx],
    false,
    {
      ...instOptions,
      payer: dappSessionKeypair.publicKey,
    },
  );

  try {
    await sendAndConfirmTransactionWithLogs(
      connection,
      signTransfer,
      [dappSessionKeypair],
      'TransferSOL',
    );
  } catch (err) {
    if (err instanceof SendTransactionError) {
      console.error('🚨 Simulation failed:', err.message);
      const logs = await err.getLogs(connection);
      if (logs) console.error(logs.join('\n'));
    } else {
      console.error('Unexpected error:', err);
    }
    return;
  }

  console.log(
    '✅ Swig balance after transfer:',
    await connection.getBalance(swigAddress),
  );
})();
