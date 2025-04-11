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
  Ed25519SessionAuthority,
  findSwigPda,
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
  signers: Keypair[] = [],
) {
  let transaction = new Transaction();
  transaction.instructions = [instruction];
  transaction.feePayer = payer.publicKey;
  transaction.recentBlockhash = svm.latestBlockhash();

  transaction.sign(payer, ...signers);

  let tx = svm.sendTransaction(transaction);

  if (tx instanceof FailedTransactionMetadata) {
    console.log('tx:', tx.meta().logs());
  }

  if (tx instanceof TransactionMetadata) {
    console.log('tx:', tx.logs());
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

let payer = Keypair.generate();
svm.airdrop(payer.publicKey, BigInt(LAMPORTS_PER_SOL));

let id = Uint8Array.from(Array(32).fill(0));

//
// * Find a swig pda by id
//
let [swigAddress] = findSwigPda(id);

//
// * make an Authority (in this case, out of a ed25519 publickey)
//
let rootAuthority = Ed25519SessionAuthority.uninitialized(
  userRootKeypair.publicKey,
  100n,
);

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

// svm.warpToSlot(3n);

sendSVMTransaction(svm, createSwigInstruction, userRootKeypair);

// svm.wa
console.log('next slot:', svm.getSlotHistory().nextSlot);

//
// * fetch swig
//
// * swig.refetch(connection, ...args) method available
//
let swig = fetchSwig(svm, swigAddress);
// swig.refetch(connection)

//
// * find role by id
//
let rootRole = swig.findRoleById(0);

if (!rootRole) throw new Error('Role not found for authority');

svm.airdrop(swigAddress, BigInt(LAMPORTS_PER_SOL));

let newSessionInstruction = rootRole.createSession({
  payer: rootAuthority.address,
  sessionDuration: 50n,
  newSessionKey: userAuthorityManagerKeypair.publicKey,
});

if (!newSessionInstruction) throw new Error('Session is null');

console.log(
  'session instruction:',
  Uint8Array.from(newSessionInstruction.data),
);

sendSVMTransaction(svm, newSessionInstruction, userRootKeypair);

swig = fetchSwig(svm, swigAddress);

rootRole = swig.findRolesBySessionKey(userAuthorityManagerKeypair.publicKey)[0];

if (!rootRole || !rootRole.isSessionBased())
  throw new Error('not session based dapp role');

console.log();
console.log('usrauth key:', userAuthorityManagerKeypair.publicKey.toBase58());
console.log('session key:', rootRole.authority.sessionKey.toBase58());
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

console.log('balance before first transfer:', svm.getBalance(swigAddress));
console.log(
  'balance dapp before first transfer:',
  svm.getBalance(dappAuthorityKeypair.publicKey),
);

//
// * spend max sol permitted
//
let transfer = SystemProgram.transfer({
  fromPubkey: swigAddress,
  toPubkey: dappAuthorityKeypair.publicKey,
  lamports: 0.1 * LAMPORTS_PER_SOL,
});

let signTransfer = rootRole.sign({
  payer: userAuthorityManagerKeypair.publicKey,
  innerInstructions: [transfer],
});

sendSVMTransaction(svm, signTransfer, userAuthorityManagerKeypair);

console.log('balance after first transfer:', svm.getBalance(swigAddress));
console.log(
  'balance dapp after first transfer:',
  svm.getBalance(dappAuthorityKeypair.publicKey),
);
