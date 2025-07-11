import {
  SYSTEM_PROGRAM_ADDRESS,
  getTransferSolInstructionDataEncoder,
} from '@solana-program/system';
import {
  AccountRole,
  addSignersToTransactionMessage,
  appendTransactionMessageInstructions,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  createTransactionMessage,
  generateKeyPairSigner,
  getSignatureFromTransaction,
  lamports,
  pipe,
  sendAndConfirmTransactionFactory,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
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
  getSignInstructions,
} from '@swig-wallet/kit';
import chalk from 'chalk';

const LAMPORTS_PER_SOL = 1_000_000_000;

function getSolTransferInstruction(args: {
  fromAddress: Address;
  toAddress: Address;
  lamports: number;
}) {
  return {
    programAddress: SYSTEM_PROGRAM_ADDRESS,
    accounts: [
      { address: args.fromAddress, role: AccountRole.WRITABLE_SIGNER },
      { address: args.toAddress, role: AccountRole.WRITABLE },
    ],
    data: new Uint8Array(
      getTransferSolInstructionDataEncoder().encode({ amount: args.lamports }),
    ),
  };
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
  connection: ReturnType<typeof createConnection>,
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

  const signedTransaction = await signTransactionMessageWithSigners(
    transactionMessage,
  );

  await sendAndConfirmTransactionFactory(connection)(signedTransaction, {
    commitment: 'confirmed',
  });

  return getSignatureFromTransaction(signedTransaction).toString();
}

function createConnection() {
  return {
    rpc: createSolanaRpc('http://localhost:8899'),
    rpcSubscriptions: createSolanaRpcSubscriptions('ws://localhost:8900'),
  };
}

function randomBytes(length: number): Uint8Array {
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  return arr;
}

function section(title: string) {
  console.log('\n' + chalk.blue.bold('🔹 ' + title));
}
function success(msg: string) {
  console.log(chalk.green('✓ ' + msg));
}
function info(msg: string) {
  console.log(chalk.cyan('ℹ ' + msg));
}
function fail(msg: string) {
  console.log(chalk.red('✗ ' + msg));
}

console.log(chalk.bold.blue('\n🎯 SWIG Subscription Example'));
console.log(
  chalk.gray(
    'This example demonstrates how to implement a subscription service using SWIG\n',
  ),
);

const connection = createConnection();

section('Setting up the environment');

const root = await generateKeyPairSigner();
const subscription = await generateKeyPairSigner();
success('Generated keypairs for swig root and subscription service');

section('Funding accounts');
await Promise.all([
  connection.rpc
    .requestAirdrop(root.address, lamports(10n * BigInt(LAMPORTS_PER_SOL)))
    .send(),
  connection.rpc
    .requestAirdrop(subscription.address, lamports(10n * BigInt(LAMPORTS_PER_SOL)))
    .send(),
]);
success('Airdropped 10 SOL to all participants');

await new Promise((r) => setTimeout(r, 3000)); // Wait for airdrop

section('Creating SWIG wallet');
const swigId = randomBytes(32);
const swigAddress = await findSwigPda(swigId);
info(`SWIG wallet address: ${chalk.yellow(swigAddress)}`);

section('Configuring SWIG wallet');
const createSwigIx = await getCreateSwigInstruction({
  payer: root.address,
  actions: Actions.set().all().get(),
  authorityInfo: createEd25519AuthorityInfo(root.address),
  id: swigId,
});
await sendTransaction(connection, [createSwigIx], root);
success('Created SWIG wallet with root authority');

await connection.rpc
  .requestAirdrop(swigAddress, lamports(BigInt(10 * LAMPORTS_PER_SOL)))
  .send();

const swig = await fetchSwig(connection.rpc, swigAddress);
const rootRole = swig.findRolesByEd25519SignerPk(root.address)[0];

section('Setting up subscription limits');
const recurringActions = Actions.set()
  .solRecurringLimit({
    recurringAmount: BigInt(0.1 * LAMPORTS_PER_SOL),
    window: BigInt(20), // block-based
  })
  .get();

const addAuthorityIx = await getAddAuthorityInstructions(
  swig,
  rootRole.id,
  createEd25519AuthorityInfo(subscription.address),
  recurringActions,
);
await sendTransaction(connection, addAuthorityIx, root);
await swig.refetch();
success('Added subscription service authority with 0.1 SOL monthly limit');

section('Testing subscription payments');

async function tryTransfer(label: string, expectedToSucceed = true) {
  info(`ℹ ${label}`);

  const ix = getSolTransferInstruction({
    fromAddress: swigAddress,
    toAddress: subscription.address,
    lamports: 0.1 * LAMPORTS_PER_SOL,
  });

  const role = swig.findRolesByEd25519SignerPk(subscription.address)[0];
  const signIx = await getSignInstructions(swig, role.id, [ix]);

  try {
    await sendTransaction(connection, signIx, subscription);
    if (expectedToSucceed) {
      success(`✓ ${label}`);
    } else {
      fail(`✗ ${label} unexpectedly succeeded`);
    }
  } catch (err: any) {
    if (!expectedToSucceed) {
      success(`✓ ${label} failed as expected (monthly limit reached)`);
    } else {
      fail(`✗ ${label} failed unexpectedly: ${err.message}`);
    }
  }
}

await tryTransfer('Attempting first 0.1 SOL subscription payment...');
console.log();
await tryTransfer('Attempting second 0.1 SOL subscription payment immediately...', false);

section('Testing limit reset');
info('Waiting for 30 finalized blocks...');
const startBlock = await connection.rpc
  .getBlockHeight({ commitment: 'finalized' })
  .send();

let currentBlock = BigInt(startBlock);
const targetBlock = BigInt(startBlock) + 30n;

while (currentBlock < targetBlock) {
  await new Promise((r) => setTimeout(r, 500));
  currentBlock = await connection.rpc
    .getBlockHeight({ commitment: 'finalized' })
    .send()
    .then((r) => BigInt(r));
}
success(`Advanced from block ${startBlock} to ${currentBlock}`);

await tryTransfer('Attempting third 0.1 SOL subscription payment after window reset');

console.log(chalk.green.bold('\n✨ Example completed successfully!'));
console.log(
  chalk.gray(
    'This demonstrates how SWIG can be used to implement subscription-based services',
  ),
);
