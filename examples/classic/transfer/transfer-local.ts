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
  createEd25519AuthorityInfo,
  fetchSwig,
  findSwigPda,
  getAddAuthorityInstructions,
  getCreateSwigInstruction,
  getSignInstructions,
} from '@swig-wallet/classic';
import { sleepSync } from 'bun';

//
// Helpers
//
async function sendTransaction(
  connection: Connection,
  instruction: TransactionInstruction[],
  payer: Keypair,
) {
  const transaction = new Transaction();
  transaction.instructions = instruction;
  transaction.feePayer = payer.publicKey;
  transaction.recentBlockhash = (
    await connection.getLatestBlockhash()
  ).blockhash;

  transaction.sign(payer);

  return connection.sendRawTransaction(transaction.serialize());
}

function randomBytes(length: number): Uint8Array {
  const randomArray = new Uint8Array(length);
  crypto.getRandomValues(randomArray);
  return randomArray;
}

console.log('starting...');

const connection = new Connection('http://localhost:8899', 'confirmed');

// user root
//
const userRootKeypair = Keypair.generate();
await connection.requestAirdrop(userRootKeypair.publicKey, LAMPORTS_PER_SOL);

// user authority manager
//
const userAuthorityManagerKeypair = Keypair.generate();
await connection.requestAirdrop(
  userAuthorityManagerKeypair.publicKey,
  LAMPORTS_PER_SOL,
);

// dapp authority
//
const dappAuthorityKeypair = Keypair.generate();
await connection.requestAirdrop(
  dappAuthorityKeypair.publicKey,
  LAMPORTS_PER_SOL,
);

sleepSync(3000);

const id = randomBytes(32);

const swigAddress = findSwigPda(id);

//
// * Find a swig pda by id
//

const rootActions = Actions.set().all().get();

//
// * create swig
//

const ix = await getCreateSwigInstruction({
  payer: userRootKeypair.publicKey,
  actions: rootActions,
  authorityInfo: createEd25519AuthorityInfo(userRootKeypair.publicKey),
  id,
});

await sendTransaction(connection, [ix], userRootKeypair);

sleepSync(3000);

//
// * fetch swig
//
const swig = await fetchSwig(connection, swigAddress);

//
// * find role by authority
//
const rootRole = swig.findRolesByEd25519SignerPk(userRootKeypair.publicKey)[0];

//
// * helper for creating actions
//
const manageAuthorityActions = Actions.set().manageAuthority().get();

//
// * can call instructions associated with a role (or authority)
//
// * role.removeAuthority
// * role.replaceAuthority
// * role.sign
//
const addAuthorityIx = await getAddAuthorityInstructions(
  swig,
  rootRole.id,
  createEd25519AuthorityInfo(userAuthorityManagerKeypair.publicKey),
  manageAuthorityActions,
);

await sendTransaction(connection, addAuthorityIx, userRootKeypair);

sleepSync(3000);

//
// * update the swig utilty with Swig.refetch
//
// swig = await fetchSwig(connection, swigAddress);
await swig.refetch();

const managerRole = swig.findRolesByEd25519SignerPk(
  userAuthorityManagerKeypair.publicKey,
)[0];

if (!managerRole) throw new Error('Role not found for authority');

//
// * perform actions check on a role
//
// * role.hasAllAction
// * role.canSpendSol
// * role.canSpendToken
// * e.t.c
// //
if (!managerRole.actions.canManageAuthority())
  throw new Error('Selected role cannot manage authority');

//
// * allocate 0.1 max sol spend, for the dapp
//
const dappAuthorityActions = Actions.set()
  .solLimit({ amount: BigInt(0.1 * LAMPORTS_PER_SOL) })
  .get();

//
// * makes the dapp an authority
//
const addDappAuthorityInstruction = await getAddAuthorityInstructions(
  swig,
  managerRole.id,
  createEd25519AuthorityInfo(dappAuthorityKeypair.publicKey),
  dappAuthorityActions,
);

await sendTransaction(
  connection,
  addDappAuthorityInstruction,
  userAuthorityManagerKeypair,
);

await connection.requestAirdrop(swigAddress, LAMPORTS_PER_SOL);

sleepSync(3000);

// swig = await fetchSwig(connection, swigAddress);
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

const roleIdCanSpendSol = swig.roles
  .filter((role) => role.actions.canSpendSol(BigInt(0.1 * LAMPORTS_PER_SOL)))
  .map((role) => role.id);

//
// * find a role by id
//
const maybeDappRole = await swig.findRoleById(roleIdCanSpendSol[1]);
if (!maybeDappRole) throw new Error('Role does not exist');

//
// * check if the authority on a role matches
//
if (
  !maybeDappRole.authority.matchesSigner(
    dappAuthorityKeypair.publicKey.toBytes(),
  )
)
  throw new Error('Role authority is not the authority');

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

let dappAuthorityRole = (
  await swig.findRolesByEd25519SignerPk(dappAuthorityKeypair.publicKey)
)[0];

let signTransfer = await getSignInstructions(swig, dappAuthorityRole.id, [
  transfer,
]);

const tx = await sendTransaction(connection, signTransfer, dappAuthorityKeypair);

console.log(`https://explorer.solana.com/tx/${tx}?cluster=custom`);

sleepSync(3000);

console.log(
  'balance after first transfer:',
  await connection.getBalance(swigAddress),
);

// swig = await fetchSwig(connection, swigAddress);
await swig.refetch();

//
// * try spend sol
transfer = SystemProgram.transfer({
  fromPubkey: swigAddress,
  toPubkey: dappAuthorityKeypair.publicKey,
  lamports: 0.05 * LAMPORTS_PER_SOL,
});

dappAuthorityRole = swig.findRolesByEd25519SignerPk(
  dappAuthorityKeypair.publicKey,
)[0];

signTransfer = await getSignInstructions(swig, dappAuthorityRole.id, [
  transfer,
]);

await sendTransaction(connection, signTransfer, dappAuthorityKeypair)
  .then(() => {
    throw new Error(
      'Transaction succeeded! Dapp authority spent more than allowed',
    );
  })
  .catch(() =>
    console.log('Transaction failed after tying to spend more than allowance!'),
  );

sleepSync(3000);

console.log(
  'balance after second transfer:',
  await connection.getBalance(swigAddress),
);
