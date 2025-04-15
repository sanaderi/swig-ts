import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  Actions,
  addAuthorityInstruction,
  Ed25519Authority,
  findSwigPda,
  signInstruction,
  Swig,
  SWIG_PROGRAM_ADDRESS,
} from '@swig/classic';
import {
  FailedTransactionMetadata,
  LiteSVM,
  TransactionMetadata,
} from 'litesvm';
import { readFileSync } from 'node:fs';

//
// Helpers
//
function sendSVMTransaction(
  svm: LiteSVM,
  instruction: TransactionInstruction,
  payer: Keypair,
) {
  let transaction = new Transaction();
  transaction.instructions = [instruction];
  transaction.feePayer = payer.publicKey;
  transaction.recentBlockhash = svm.latestBlockhash();

  transaction.sign(payer);

  let tx = svm.sendTransaction(transaction);

  if (tx instanceof FailedTransactionMetadata) {
    console.log("tx:", tx.meta().logs())
  }

  if (tx instanceof TransactionMetadata) {
    // console.log("tx:", tx.logs())
  }
}

function fetchSwig(svm: LiteSVM, swigAddress: PublicKey): Swig {
  let swigAccount = svm.getAccount(swigAddress);
  if (!swigAccount) throw new Error('swig account not created');
  return Swig.fromRawAccountData(swigAddress, swigAccount.data);
}

console.log('starting...');
//
// Start program
//
let swigProgram = Uint8Array.from(readFileSync('swig.so'));

let svm = new LiteSVM();

svm.addProgram(SWIG_PROGRAM_ADDRESS, swigProgram);

// user root
//
let userRootKeypair = Keypair.generate();
svm.airdrop(userRootKeypair.publicKey, BigInt(LAMPORTS_PER_SOL));

// user authority manager
//
let userAuthorityManagerKeypair = Keypair.generate();
svm.airdrop(userAuthorityManagerKeypair.publicKey, BigInt(LAMPORTS_PER_SOL));

// dapp authority
//
let dappAuthorityKeypair = Keypair.generate();
svm.airdrop(dappAuthorityKeypair.publicKey, BigInt(LAMPORTS_PER_SOL));

let dappTreasury = Keypair.generate().publicKey;

let id = Uint8Array.from(Array(32).fill(0));

//
// * Find a swig pda by id
//
let [swigAddress] = findSwigPda(id);

//
// * make an Authority (in this case, out of a ed25519 publickey)
//
let rootAuthority = new Ed25519Authority(userRootKeypair.publicKey);

//
// * create swig instruction
//
// * createSwig(connection, ...args) imperative method available
//
let rootActions = Actions.set().all().get();

let createSwigInstruction = Swig.create({
  authority: rootAuthority,
  id,
  payer: userRootKeypair.publicKey,
  actions: rootActions,
});

sendSVMTransaction(svm, createSwigInstruction, userRootKeypair);

//
// * fetch swig
//
// * swig.refetch(connection, ...args) method available
//
let swig = fetchSwig(svm, swigAddress);
// swig.refetch(connection)

//
// * find role by authority
//
let rootRole = swig.findRoleByAuthority(
  new Ed25519Authority(userRootKeypair.publicKey),
);

if (!rootRole) throw new Error('Role not found for authority');

let authorityManager = new Ed25519Authority(
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
  //   window: 150_000n,
  //   last: 150n,
  // })
  // .tokenManage({ key: TOKEN_ADDRESS, amount: BigInt(100_100) })
  .get();

//
// * can call instructions associated with a role (or authority)
//
// * role.removeAuthority
// * role.replaceAuthority
// * role.sign
//
let addAuthorityIx = addAuthorityInstruction(
  rootRole,
  userRootKeypair.publicKey,
  authorityManager,
  manageAuthorityActions,
);

sendSVMTransaction(svm, addAuthorityIx, userRootKeypair);

swig = fetchSwig(svm, swigAddress);

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

let dappAuthority = new Ed25519Authority(dappAuthorityKeypair.publicKey);

//
// * allocate 0.1 max sol spend, for the dapp
//
let dappAuthorityActions = Actions.set()
  .solLimit({ amount: BigInt(0.1 * LAMPORTS_PER_SOL) })
  .get();

//
// * makes the dapp an authority
//
let addDappAuthorityInstruction = addAuthorityInstruction(
  managerRole,
  userAuthorityManagerKeypair.publicKey,
  dappAuthority,
  dappAuthorityActions,
);

sendSVMTransaction(
  svm,
  addDappAuthorityInstruction,
  userAuthorityManagerKeypair,
);

svm.airdrop(swigAddress, BigInt(LAMPORTS_PER_SOL));

swig = fetchSwig(svm, swigAddress);

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

console.log('balance before first transfer:', svm.getBalance(swigAddress));

//
// * spend max sol permitted
//
let transfer = SystemProgram.transfer({
  fromPubkey: swigAddress,
  toPubkey: dappTreasury,
  lamports: 0.1 * LAMPORTS_PER_SOL,
});

let dappAutorityRole = swig.findRoleByAuthority(dappAuthority);

if (!dappAutorityRole) throw new Error('Role not found for authority');

let signTransfer = signInstruction(
  dappAutorityRole,
  dappAuthorityKeypair.publicKey,
  [transfer],
);

sendSVMTransaction(svm, signTransfer, dappAuthorityKeypair);

console.log('balance after first transfer:', svm.getBalance(swigAddress));

swig = fetchSwig(svm, swigAddress);

//
// * try spend sol
//
transfer = SystemProgram.transfer({
  fromPubkey: swigAddress,
  toPubkey: dappTreasury,
  lamports: 0.05 * LAMPORTS_PER_SOL,
});

dappAutorityRole = swig.findRoleByAuthority(dappAuthority);

if (!dappAutorityRole) throw new Error('Role not found for authority');

signTransfer = signInstruction(
  dappAutorityRole,
  dappAuthorityKeypair.publicKey,
  [transfer],
);

sendSVMTransaction(svm, signTransfer, dappAuthorityKeypair);

console.log('balance after second transfer:', svm.getBalance(swigAddress));
