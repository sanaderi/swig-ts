import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  Actions,
  createSwig,
  Ed25519SessionAuthority,
  fetchSwig,
  findSwigPda,
} from '@swig/classic';

//
// Helpers
//
async function sendTransaction(
  connection: Connection,
  instruction: TransactionInstruction,
  payer: Keypair,
) {
  let transaction = new Transaction();
  transaction.instructions = [instruction];
  transaction.feePayer = payer.publicKey;
  transaction.recentBlockhash = (
    await connection.getLatestBlockhash()
  ).blockhash;

  transaction.sign(payer);

  return connection.sendRawTransaction(transaction.serialize(), {
    skipPreflight: false,
  });
}

function randomBytes(length: number): Uint8Array {
  const randomArray = new Uint8Array(length);
  crypto.getRandomValues(randomArray);
  return randomArray;
}

export function sleep(s: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, s * 1000));
}

console.log('starting...');

let connection = new Connection('http://localhost:8899', 'confirmed');

// user root
//
let userRootKeypair = Keypair.generate();
let tx = await connection.requestAirdrop(
  userRootKeypair.publicKey,
  LAMPORTS_PER_SOL,
);

// user authority manager
//
let userAuthorityManagerKeypair = Keypair.generate();
await connection.requestAirdrop(
  userAuthorityManagerKeypair.publicKey,
  LAMPORTS_PER_SOL,
);

// dapp authority
//
let dappAuthorityKeypair = Keypair.generate();
await connection.requestAirdrop(
  dappAuthorityKeypair.publicKey,
  LAMPORTS_PER_SOL,
);

await sleep(3);

let id = randomBytes(32);

//
// * Find a swig pda by id
//
let [swigAddress] = findSwigPda(id);

//
// * make an Authority (in this case, out of a Ed25519 publickey)
//
// * e.g Authority.secp256k1
// * session based Authority support
//
let rootAuthority = Ed25519SessionAuthority.uninitialized(
  userRootKeypair.publicKey,
  100n,
);

let rootActions = Actions.set().all().get();

//
// * create swig
//
await createSwig(
  connection,
  id,
  rootAuthority,
  rootActions,
  userRootKeypair.publicKey,
  [userRootKeypair],
);

await sleep(3);

//
// * fetch swig
//
let swig = await fetchSwig(connection, swigAddress);

//
// * find role by id
//
let rootRole = swig.findRoleById(0);

if (!rootRole) throw new Error('Role not found for authority');

// * can call instructions associated with a role (or authority)
//
// * role.removeAuthority
// * role.replaceAuthority
// * role.sign
//
let createSessionInstruction = rootRole.createSession({
  payer: userRootKeypair.publicKey,
  newSessionKey: userAuthorityManagerKeypair.publicKey,
  sessionDuration: 50n,
})!;

await sendTransaction(connection, createSessionInstruction, userRootKeypair);

await sleep(3);

await connection.requestAirdrop(swigAddress, LAMPORTS_PER_SOL);

await sleep(3);

await swig.refetch(connection);

//
// * role array methods (we check what roles can spend sol)
//
console.log(
  'Has ability to spend sol:',
  swig.roles.map((role) => role.canSpendSol()),
);
console.log(
  'Can spend 0.1 sol:',
  swig.roles.map((role) => role.canSpendSol(BigInt(0.1 * LAMPORTS_PER_SOL))),
);
console.log(
  'Can spend 0.11 sol:',
  swig.roles.map((role) => role.canSpendSol(BigInt(0.11 * LAMPORTS_PER_SOL))),
);

console.log(
  'balance before first transfer:',
  await connection.getBalance(swigAddress),
);

//
// * spend max sol permitted
//
let transfer = SystemProgram.transfer({
  fromPubkey: swigAddress,
  toPubkey: dappAuthorityKeypair.publicKey,
  lamports: 0.1 * LAMPORTS_PER_SOL,
});

rootRole = swig.findRolesBySessionKey(userAuthorityManagerKeypair.publicKey)[0];

if (!rootRole || !rootRole.isSessionBased())
  throw new Error('Role not found for authority');

let signTransfer = rootRole.sign({
  payer: userAuthorityManagerKeypair.publicKey,
  innerInstructions: [transfer],
});

tx = await sendTransaction(
  connection,
  signTransfer,
  userAuthorityManagerKeypair,
);

console.log(`https://explorer.solana.com/tx/${tx}?cluster=custom`);

await sleep(3);

console.log(
  'balance after first transfer:',
  await connection.getBalance(swigAddress),
);

