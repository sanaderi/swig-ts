import {
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  generateKeyPairSigner,
  getSignatureFromTransaction,
  lamports,
  pipe,
  sendAndConfirmTransactionFactory,
  signTransactionMessageWithSigners,
  createTransactionMessage,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstructions,
  addSignersToTransactionMessage,
  type Address,
  type Blockhash,
  type IInstruction,
  type KeyPairSigner,
} from '@solana/kit';

import {
  Actions,
  createEd25519AuthorityInfo,
  fetchSwig,
  findSwigPda,
  getAddAuthorityInstructions,
  getCreateSwigInstruction,
} from '@swig-wallet/kit';

import chalk from 'chalk';
import { sleepSync } from 'bun';

function randomBytes(length: number): Uint8Array {
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  return arr;
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
  const txMsg = getTransactionMessage(instructions, latestBlockhash, payer, signers);
  const signedTx = await signTransactionMessageWithSigners(txMsg);
  await sendAndConfirmTransactionFactory(connection as any)(signedTx, { commitment: 'confirmed' });
  return getSignatureFromTransaction(signedTx).toString();
}

async function createSwigAccount(connection: any, user: KeyPairSigner) {
  const id = randomBytes(32);
  const swigAddress = await findSwigPda(id);
  const rootActions = Actions.set().manageAuthority().get();
  const authorityInfo = createEd25519AuthorityInfo(user.address);

  const ix = await getCreateSwigInstruction({
    payer: user.address,
    id,
    actions: rootActions,
    authorityInfo,
  });

  const sig = await sendTransaction(connection, [ix], user);

  console.log(chalk.green('✓ Swig account created at:'), chalk.cyan(swigAddress.toString()));
  console.log(chalk.blue('Transaction signature:'), chalk.cyan(sig));

  return { swigAddress, transactionSignature: sig };
}

async function addNewAuthority(
  connection: any,
  rootUser: KeyPairSigner,
  newAuthority: KeyPairSigner,
  swigAddress: Address,
  actions: any, // Actions built from the Actions builder pattern
  description: string,
) {
  const swig = await fetchSwig(connection.rpc, swigAddress);
  const rootRole = swig.findRolesByEd25519SignerPk(rootUser.address)[0];
  if (!rootRole) throw new Error('Root role not found');

  const ix = await getAddAuthorityInstructions(
    swig,
    rootRole.id,
    createEd25519AuthorityInfo(newAuthority.address),
    actions,
  );

  await sendTransaction(connection, ix, rootUser);

  console.log(
    chalk.green(`✓ New ${description} authority added:`),
    chalk.cyan(newAuthority.address.toString()),
  );
}

(async () => {
  console.log(chalk.blue('🚀 Starting tutorial - Swig + Kit style'));

  const connection = {
    rpc: createSolanaRpc('http://localhost:8899'),
    rpcSubscriptions: createSolanaRpcSubscriptions('ws://localhost:8900'),
  };

  const rootUser = await generateKeyPairSigner();
  console.log(chalk.green('👤 Root user public key:'), chalk.cyan(rootUser.address.toString()));

  await connection.rpc
    .requestAirdrop(rootUser.address, lamports(BigInt(100 * 1_000_000_000)))
    .send();

  sleepSync(2000);

  console.log(chalk.yellow('\n📝 Creating Swig account...'));
  const { swigAddress } = await createSwigAccount(connection, rootUser);

  const spendingAuthority = await generateKeyPairSigner();
  const tokenAuthority = await generateKeyPairSigner();

  console.log(chalk.green('\n👥 Spending authority public key:'), chalk.cyan(spendingAuthority.address.toString()));
  console.log(chalk.green('👥 Token authority public key:'), chalk.cyan(tokenAuthority.address.toString()));

  sleepSync(2000);

  const spendingActions = Actions.set()
    .solLimit({ amount: BigInt(0.1 * 1_000_000_000) })
    .get();

  await addNewAuthority(connection, rootUser, spendingAuthority, swigAddress, spendingActions, 'spending');

  const fakeMint = await generateKeyPairSigner(); // fake mint as publicKey
  const tokenActions = Actions.set()
    .tokenLimit({ mint: fakeMint.address, amount: BigInt(1_000_000) })
    .get();

  await addNewAuthority(connection, rootUser, tokenAuthority, swigAddress, tokenActions, 'token');

  const swig = await fetchSwig(connection.rpc, swigAddress);

  console.log(chalk.blue('\n📊 Authority Permissions:'));

  const spendingRole = swig.findRolesByEd25519SignerPk(spendingAuthority.address)[0];
  console.log(chalk.yellow('Spending Authority:'));
  console.log(
    '- Can spend SOL:',
    chalk.green(spendingRole.actions.canSpendSol(BigInt(0.1 * 1_000_000_000))),
  );
  console.log(
    '- Can spend tokens:',
    chalk.red(spendingRole.actions.canSpendToken(fakeMint.address, BigInt(1_000_000))),
  );

  const tokenRole = swig.findRolesByEd25519SignerPk(tokenAuthority.address)[0];
  console.log(chalk.yellow('\nToken Authority:'));
  console.log(
    '- Can spend SOL:',
    chalk.red(tokenRole.actions.canSpendSol(BigInt(0.1 * 1_000_000_000))),
  );
  console.log(
    '- Can spend tokens:',
    chalk.green(tokenRole.actions.canSpendToken(fakeMint.address, BigInt(1_000_000))),
  );

  console.log(chalk.green('\n✨ Tutorial completed successfully!'));
  console.log(chalk.yellow('🔍 Check out your transaction on Solana Explorer:'));
 console.log(
    chalk.cyan(
      `https://explorer.solana.com/address/${swigAddress}?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899`,
    ),
  );
})();
