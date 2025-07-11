import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  type Signer,
} from '@solana/web3.js';
import {
  Actions,
  createEd25519SessionAuthorityInfo,
  fetchSwig,
  findSwigPda,
  getCreateSessionInstructions,
  getCreateSwigInstruction,
  getSignInstructions,
} from '@swig-wallet/classic';

//
// Helpers
//
async function sendTransaction(
  connection: Connection,
  instructions: TransactionInstruction[],
  payer: Keypair,
  signers: Signer[] = [],
) {
  let transaction = new Transaction();
  transaction.instructions = instructions;
  transaction.feePayer = payer.publicKey;
  transaction.recentBlockhash = (
    await connection.getLatestBlockhash()
  ).blockhash;

  transaction.sign(payer, ...signers);

  return connection.sendRawTransaction(transaction.serialize());
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
let dappSessionKeypair = Keypair.generate();
await connection.requestAirdrop(dappSessionKeypair.publicKey, LAMPORTS_PER_SOL);

// dapp authority
//
let dappTreasury = Keypair.generate().publicKey;

await sleep(3);

let id = randomBytes(32);

//
// * Find a swig pda by id
//
let swigAddress = findSwigPda(id);

let rootActions = Actions.set().all().get();

//
// * create swig
//
let ix = await getCreateSwigInstruction({
  id,
  authorityInfo: createEd25519SessionAuthorityInfo(
    userRootKeypair.publicKey,
    100n,
  ),
  actions: rootActions,
  payer: userRootKeypair.publicKey,
});

await sendTransaction(connection, [ix], userRootKeypair);

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
let createSessionIx = await getCreateSessionInstructions(
  swig,
  rootRole.id,
  dappSessionKeypair.publicKey,
  50n,
);

await sendTransaction(connection, createSessionIx, userRootKeypair);

await sleep(3);

await connection.requestAirdrop(swigAddress, LAMPORTS_PER_SOL);

await sleep(3);

await swig.refetch();

//
// * role array methods (we check what roles can spend sol)
//
console.log(
  'Has ability to spend sol:',
  swig.roles.map((role) => role.actions.canSpendSol()),
);
console.log(
  'Can spend 0.1 sol:',
  swig.roles.map((role) =>
    role.actions.canSpendSol(BigInt(0.1 * LAMPORTS_PER_SOL)),
  ),
);
console.log(
  'Can spend 0.11 sol:',
  swig.roles.map((role) =>
    role.actions.canSpendSol(BigInt(0.11 * LAMPORTS_PER_SOL)),
  ),
);

console.log(
  'swig balance before first transfer:',
  await connection.getBalance(swigAddress),
);
console.log(
  'dapp treasury balance before first transfer:',
  await connection.getBalance(dappTreasury),
);

//
// * spend max sol permitted
//
let transfer = SystemProgram.transfer({
  fromPubkey: swigAddress,
  toPubkey: dappTreasury,
  lamports: 0.1 * LAMPORTS_PER_SOL,
});

rootRole = swig.findRoleBySessionKey(dappSessionKeypair.publicKey);

if (!rootRole || !rootRole.isSessionBased())
  throw new Error('Role not found for authority');

if (
  rootRole.authority.sessionKey.toBase58() !==
  dappSessionKeypair.publicKey.toBase58()
) {
  throw new Error('wrong session authority authority');
}

let signTransfer = await getSignInstructions(
  swig,
  rootRole.id,
  [transfer],
  false,
  { payer: dappSessionKeypair.publicKey },
);

tx = await sendTransaction(connection, signTransfer, dappSessionKeypair);

console.log(`https://explorer.solana.com/tx/${tx}?cluster=custom`);

await sleep(3);

console.log(
  'swig balance after first transfer:',
  await connection.getBalance(swigAddress),
);
console.log(
  'dapp treasury balance after first transfer:',
  await connection.getBalance(dappTreasury),
);
