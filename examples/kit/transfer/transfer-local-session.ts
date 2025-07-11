import {
  getTransferSolInstructionDataEncoder,
  SYSTEM_PROGRAM_ADDRESS,
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
  type IInstruction,
  type KeyPairSigner,
  type Rpc,
  type RpcSubscriptions,
  type SolanaRpcApi,
  type SolanaRpcSubscriptionsApi,
} from '@solana/kit';
import {
  Actions,
  createEd25519SessionAuthorityInfo,
  fetchSwig,
  findSwigPda,
  getCreateSessionInstructions,
  getCreateSwigInstruction,
  getSignInstructions,
} from '@swig-wallet/kit';
import { sleepSync } from 'bun';

function randomBytes(length: number): Uint8Array {
  const randomArray = new Uint8Array(length);
  crypto.getRandomValues(randomArray);
  return randomArray;
}

const LAMPORTS_PER_SOL = 1_000_000_000;

console.log('starting...');

const connection = {
  rpc: createSolanaRpc('http://localhost:8899'),
  rpcSubscriptions: createSolanaRpcSubscriptions('ws://localhost:8900'),
};

// User keypair (root authority)
const userRootKeypair = await generateKeyPairSigner();
console.log('Generated root signer:', userRootKeypair.address.toString());
await connection.rpc
  .requestAirdrop(userRootKeypair.address, lamports(BigInt(LAMPORTS_PER_SOL)))
  .send();

// Session authority
const dappSessionKeypair = await generateKeyPairSigner();
console.log('Generated session signer:', dappSessionKeypair.address.toString());
await connection.rpc
  .requestAirdrop(dappSessionKeypair.address, lamports(BigInt(LAMPORTS_PER_SOL)))
  .send();

// Treasury destination
const dappTreasury = await generateKeyPairSigner();
console.log('Generated treasury address:', dappTreasury.address.toString());

sleepSync(3000);

const id = randomBytes(32);
console.log('Generated Swig ID:', Buffer.from(id).toString('hex'));

const swigAddress = await findSwigPda(id);
console.log('Swig PDA address:', swigAddress.toString());

const rootActions = Actions.set().all().get();

const createSwigIx = await getCreateSwigInstruction({
  id,
  authorityInfo: createEd25519SessionAuthorityInfo(userRootKeypair.address, 100n),
  actions: rootActions,
  payer: userRootKeypair.address,
});

console.log('Creating Swig...');
await sendTransaction(connection, [createSwigIx], userRootKeypair);
console.log('Swig created.');

sleepSync(3000);

const swig = await fetchSwig(connection.rpc, swigAddress);
console.log('Fetched Swig:', swig.address.toString());

const rootRole = swig.findRoleById(0);
if (!rootRole) throw new Error('Role not found for authority');
console.log('Using root role ID:', rootRole.id);

const createSessionIx = await getCreateSessionInstructions(
  swig,
  rootRole.id,
  dappSessionKeypair.address,
  50n,
);
console.log('Creating session...');
await sendTransaction(connection, createSessionIx, userRootKeypair);
console.log('Session created for:', dappSessionKeypair.address.toString());

await connection.rpc
  .requestAirdrop(swigAddress, lamports(BigInt(LAMPORTS_PER_SOL)))
  .send();
sleepSync(3000);
await swig.refetch();
console.log('Swig balance after airdrop:', await connection.rpc.getBalance(swigAddress).send().then(res => res.value));

console.log(
  'Roles can spend sol:',
  swig.roles.map((r) => r.actions.canSpendSol()),
);
console.log(
  'Roles can spend 0.1 SOL:',
  swig.roles.map((r) => r.actions.canSpendSol(BigInt(0.1 * LAMPORTS_PER_SOL))),
);
console.log(
  'Roles can spend 0.11 SOL:',
  swig.roles.map((r) => r.actions.canSpendSol(BigInt(0.11 * LAMPORTS_PER_SOL))),
);

console.log('Swig balance before transfer:', await connection.rpc.getBalance(swigAddress).send().then(res => res.value));
console.log('Treasury balance before transfer:', await connection.rpc.getBalance(dappTreasury.address).send().then(res => res.value));

const transferIx = {
  programAddress: SYSTEM_PROGRAM_ADDRESS,
  accounts: [
    { address: swigAddress, role: AccountRole.WRITABLE_SIGNER },
    { address: dappTreasury.address, role: AccountRole.WRITABLE },
  ],
  data: new Uint8Array(
    getTransferSolInstructionDataEncoder().encode({
      amount: BigInt(0.1 * LAMPORTS_PER_SOL),
    })
  ),
};

const sessionRole = swig.findRolesByEd25519SignerPk(dappSessionKeypair.address)[0];
if (!sessionRole || !sessionRole.isSessionBased()) throw new Error('Invalid session role');
console.log('Using session role ID:', sessionRole.id);

const signedTransferIx = await getSignInstructions(
  swig,
  sessionRole.id,
  [transferIx],
  false,
  { payer: dappSessionKeypair.address },
);

console.log('Signing transfer...');
const tx = await sendTransaction(connection, signedTransferIx, dappSessionKeypair);
console.log(`Transaction submitted: https://explorer.solana.com/tx/${tx}?cluster=custom`);

sleepSync(3000);

console.log('Swig balance after transfer:', await connection.rpc.getBalance(swigAddress).send().then(res => res.value));
console.log('Treasury balance after transfer:', await connection.rpc.getBalance(dappTreasury.address).send().then(res => res.value));

//
// Transaction helper
//
async function sendTransaction<T extends IInstruction[]>(
  connection: {
    rpc: Rpc<SolanaRpcApi>;
    rpcSubscriptions: RpcSubscriptions<SolanaRpcSubscriptionsApi>;
  },
  instructions: T,
  payer: KeyPairSigner,
  signers: KeyPairSigner[] = [],
) {
  const { value: latestBlockhash } = await connection.rpc.getLatestBlockhash().send();
  const transactionMessage = pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayerSigner(payer, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
    (tx) => appendTransactionMessageInstructions(instructions, tx),
    (tx) => addSignersToTransactionMessage(signers, tx),
  );

  const signedTx = await signTransactionMessageWithSigners(transactionMessage);
  await sendAndConfirmTransactionFactory(connection)(signedTx, { commitment: 'confirmed' });
  return getSignatureFromTransaction(signedTx).toString();
}
