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
  addAuthorityInstruction,
  createSwig,
  Ed25519Authority,
  fetchSwig,
  findSwigPda,
  signInstruction,
} from '@swig-wallet/classic';

//
// Helpers
//
function formatSolLimit(limit: bigint | null): string {
  return limit === null
    ? 'unlimited'
    : `${Number(limit) / LAMPORTS_PER_SOL} SOL`;
}

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
let rootAuthority = Ed25519Authority.fromPublicKey(userRootKeypair.publicKey);

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
// * find role by authority
//
let rootRole = swig.findRoleByAuthority(rootAuthority);

if (!rootRole) throw new Error('Role not found for authority');

let authorityManager = Ed25519Authority.fromPublicKey(
  userAuthorityManagerKeypair.publicKey,
);

//
// * helper for creating actions
//
let manageAuthorityActions = Actions.set()
  // .all()
  .manageAuthority()
  // .solTemporal({
  //   amount: BigInt(LAMPORTS_PER_SOL),
  //   window: 150n,
  //   last: 150_000n,
  // })
  // .tokenManage({ key: PublicKey.unique(), amount: BigInt(100_100) })
  .get();

//
// * can call instructions associated with a role (or authority)
//
// * role.removeAuthority
// * role.replaceAuthority
// * role.sign
//
let addAuthorityIx = await addAuthorityInstruction(
  rootRole,
  userRootKeypair.publicKey,
  authorityManager,
  manageAuthorityActions,
);

await sendTransaction(connection, addAuthorityIx, userRootKeypair);

await sleep(3);

//
// * update the swig utilty with Swig.refetch
//
await swig.refetch(connection);

console.log(
  'Spending limits:',
  swig.roles.map((role) => formatSolLimit(role.solSpendLimit())),
);

let managerRole = swig.findRoleByAuthority(authorityManager);

if (!managerRole) throw new Error('Role not found for authority');

//
// * perform actions check on a role
//
// * role.hasAllAction
// * role.canSpendSol
// * role.canSpendToken
// * e.t.c
//
if (!managerRole.canManageAuthority())
  throw new Error('Selected role cannot manage authority');

let dappAuthority = Ed25519Authority.fromPublicKey(
  dappAuthorityKeypair.publicKey,
);

//
// * allocate 0.1 max sol spend, for the dapp
//
let dappAuthorityActions = Actions.set()
  .solLimit({ amount: BigInt(0.1 * LAMPORTS_PER_SOL) })
  .get();

//
// * makes the dapp an authority
//
let addDappAuthorityInstruction = await addAuthorityInstruction(
  managerRole,
  userAuthorityManagerKeypair.publicKey,
  dappAuthority,
  dappAuthorityActions,
);

await sendTransaction(
  connection,
  addDappAuthorityInstruction,
  userAuthorityManagerKeypair,
);

await connection.requestAirdrop(swigAddress, LAMPORTS_PER_SOL);

await sleep(3);

await swig.refetch(connection);

let dappAutorityRole = swig.findRoleByAuthority(dappAuthority);

if (!dappAutorityRole) throw new Error('Role not found for authority');

console.log('Spending limits for each role:');
console.log('Root role:', formatSolLimit(rootRole.solSpendLimit()));
console.log('Manager role:', formatSolLimit(managerRole.solSpendLimit()));
console.log('Dapp role:', formatSolLimit(dappAutorityRole.solSpendLimit()));

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

let roleIdCanSpendSol = swig.roles
  .filter((role) => role.canSpendSol(BigInt(0.1 * LAMPORTS_PER_SOL)))
  .map((role) => role.id);

//
// * find a role by id
//
let maybeDappRole = swig.findRoleById(roleIdCanSpendSol[1]);
if (!maybeDappRole) throw new Error('Role does not exist');

//
// * check if the authority on a role matches
//
if (!maybeDappRole.authority.isEqual(dappAuthority))
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

let signTransfer = await signInstruction(
  dappAutorityRole,
  dappAuthorityKeypair.publicKey,
  [transfer],
);

tx = await sendTransaction(connection, signTransfer, dappAuthorityKeypair);

console.log(`https://explorer.solana.com/tx/${tx}?cluster=custom`);

await sleep(3);

console.log(
  'balance after first transfer:',
  await connection.getBalance(swigAddress),
);

await swig.refetch(connection);

//
// * try spend sol
//
transfer = SystemProgram.transfer({
  fromPubkey: swigAddress,
  toPubkey: dappAuthorityKeypair.publicKey,
  lamports: 0.05 * LAMPORTS_PER_SOL,
});

dappAutorityRole = swig.findRoleByAuthority(dappAuthority);

if (!dappAutorityRole) throw new Error('Role not found for authority');

signTransfer = await signInstruction(
  dappAutorityRole,
  dappAuthorityKeypair.publicKey,
  [transfer],
);

await sendTransaction(connection, signTransfer, dappAuthorityKeypair)
  .then(() => {
    throw new Error(
      'Transaction succeeded! Dapp authority spent more than allowed',
    );
  })
  .catch(() =>
    console.log('Transaction failed after tying to spend more than allowance!'),
  );

console.log(
  'balance after second transfer:',
  await connection.getBalance(swigAddress),
);
