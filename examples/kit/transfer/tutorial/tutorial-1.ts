import {
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  generateKeyPairSigner,
  sendAndConfirmTransactionFactory,
  signTransactionMessageWithSigners,
  getSignatureFromTransaction,
  lamports,
  pipe,
  createTransactionMessage,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstructions,
  addSignersToTransactionMessage,
  type IInstruction,
  type KeyPairSigner,
  type Blockhash,
} from '@solana/kit';

import {
  Actions,
  createEd25519AuthorityInfo,
  findSwigPda,
  getCreateSwigInstruction,
} from '@swig-wallet/kit';

import chalk from 'chalk';
import { sleepSync } from 'bun';

// ---------------------------------------
// Util
// ---------------------------------------
function randomBytes(length: number): Uint8Array {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return array;
}

function getTransactionMessage<Inst extends IInstruction[]>(
  instructions: Inst,
  latestBlockhash: Readonly<{
    blockhash: Blockhash;
    lastValidBlockHeight: bigint;
  }>,
  feePayer: KeyPairSigner,
  signers: KeyPairSigner[] = [],
) {
  return pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayerSigner(feePayer, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
    (tx) => appendTransactionMessageInstructions(instructions, tx),
    (tx) => addSignersToTransactionMessage(signers, tx),
  );
}

async function sendTransaction<T extends IInstruction[]>(
  connection: {
    rpc: ReturnType<typeof createSolanaRpc>;
    rpcSubscriptions: ReturnType<typeof createSolanaRpcSubscriptions>;
  },
  instructions: T,
  payer: KeyPairSigner,
  signers: KeyPairSigner[] = [],
) {
  const { value: latestBlockhash } = await connection.rpc
    .getLatestBlockhash()
    .send();
  const transactionMessage = getTransactionMessage(
    instructions,
    latestBlockhash,
    payer,
    signers,
  );
  const signedTransaction =
    await signTransactionMessageWithSigners(transactionMessage);

  await sendAndConfirmTransactionFactory(connection as any)(signedTransaction, {
    commitment: 'confirmed',
  });

  const signature = getSignatureFromTransaction(signedTransaction);

  return signature.toString();
}

// ---------------------------------------
// Create Swig Account (converted function)
// ---------------------------------------
async function createSwigAccount(
  connection: {
    rpc: ReturnType<typeof createSolanaRpc>;
    rpcSubscriptions: ReturnType<typeof createSolanaRpcSubscriptions>;
  },
  user: KeyPairSigner,
) {
  try {
    const id = randomBytes(32);
    const swigAddress = await findSwigPda(id);
    const authorityInfo = createEd25519AuthorityInfo(user.address);
    const actions = Actions.set().manageAuthority().get();

    const ix = await getCreateSwigInstruction({
      payer: user.address,
      id,
      authorityInfo,
      actions,
    });

    const sig = await sendTransaction(connection, [ix], user);

    console.log(
      chalk.green('✓ Swig account created at:'),
      chalk.cyan(swigAddress.toString()),
    );
    console.log(chalk.blue('Transaction signature:'), chalk.cyan(sig));
    return swigAddress;
  } catch (error) {
    console.error(chalk.red('✗ Error creating Swig account:'), chalk.red(error));
    throw error;
  }
}

// ---------------------------------------
// Main
// ---------------------------------------
(async () => {
  console.log(chalk.blue('🚀 Starting tutorial'));

  const connection = {
    rpc: createSolanaRpc('http://localhost:8899'),
    rpcSubscriptions: createSolanaRpcSubscriptions('ws://localhost:8900'),
  };

  const user = await generateKeyPairSigner();

  // Airdrop
  await connection.rpc
    .requestAirdrop(user.address, lamports(BigInt(100 * 1_000_000_000)))
    .send();

  await sleepSync(2000);

  console.log(
    chalk.green('👤 User public key:'),
    chalk.cyan(user.address.toString()),
  );

  const swigAddress = await createSwigAccount(connection, user);

  setTimeout(() => {
    console.log(chalk.green('\n✨ Everything looks good!'));
    console.log(
      chalk.yellow('🔍 Check out your transaction on Solana Explorer:'),
    );
    console.log(
      chalk.cyan(
        `https://explorer.solana.com/address/${swigAddress.toString()}?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899`,
      ),
    );
  }, 2000);
})();
