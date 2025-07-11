import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';

import {
  Actions,
  createEd25519AuthorityInfo,
  findSwigPda,
  getCreateSwigInstruction,
} from '@swig-wallet/classic';

import chalk from 'chalk';

async function createSwigAccount(connection: Connection, user: Keypair) {
  try {
    const id = new Uint8Array(32);
    crypto.getRandomValues(id);
    const swigAddress = findSwigPda(id);
    const rootAuthorityInfo = createEd25519AuthorityInfo(user.publicKey);
    const rootActions = Actions.set().manageAuthority().get();

    const createSwigIx = await getCreateSwigInstruction({
      payer: user.publicKey,
      id,
      actions: rootActions,
      authorityInfo: rootAuthorityInfo,
    });

    const transaction = new Transaction().add(createSwigIx);
    const signature = await sendAndConfirmTransaction(connection, transaction, [
      user,
    ]);

    console.log(
      chalk.green('✓ Swig account created at:'),
      chalk.cyan(swigAddress.toBase58()),
    );
    console.log(chalk.blue('Transaction signature:'), chalk.cyan(signature));
    return swigAddress;
  } catch (error) {
    console.error(
      chalk.red('✗ Error creating Swig account:'),
      chalk.red(error),
    );
    throw error;
  }
}

(async () => {
  console.log(chalk.blue('🚀 Starting tutorial'));
  const connection = new Connection('http://localhost:8899', 'confirmed');
  const userKeypair = Keypair.generate();
  let f = await connection.requestAirdrop(
    userKeypair.publicKey,
    100 * LAMPORTS_PER_SOL,
  );
  let blockhash = await connection.getLatestBlockhash();
  await connection.confirmTransaction({
    signature: f,
    blockhash: blockhash.blockhash,
    lastValidBlockHeight: blockhash.lastValidBlockHeight,
  });
  console.log(
    chalk.green('👤 User public key:'),
    chalk.cyan(userKeypair.publicKey.toBase58()),
  );
  let swigAddress = await createSwigAccount(connection, userKeypair);
  setTimeout(() => {
    console.log(chalk.green('\n✨ Everything looks good!'));
    console.log(
      chalk.yellow('🔍 Check out your transaction on Solana Explorer:'),
    );
    console.log(
      chalk.cyan(
        `https://explorer.solana.com/address/${swigAddress.toBase58()}?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899`,
      ),
    );
  }, 2000);
})();
