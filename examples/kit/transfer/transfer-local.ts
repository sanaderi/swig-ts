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
  getAddressEncoder,
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
  type Rpc,
  type RpcSubscriptions,
  type SolanaRpcApi,
  type SolanaRpcSubscriptionsApi,
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
import { sleepSync } from 'bun';

function getSolTransferInstruction(args: {
  fromAddress: Address;
  toAddress: Address;
  lamports: number;
}) {
  return {
    programAddress: SYSTEM_PROGRAM_ADDRESS,
    accounts: [
      {
        address: args.fromAddress,
        role: AccountRole.WRITABLE_SIGNER,
      },
      {
        address: args.toAddress,
        role: AccountRole.WRITABLE,
      },
    ],
    data: new Uint8Array(
      getTransferSolInstructionDataEncoder().encode({
        amount: args.lamports,
      }),
    ),
  };
}

function getTransactionMessage<Inst extends IInstruction[]>(
  instructions: Inst,
  lastestBlockhash: Readonly<{
    blockhash: Blockhash;
    lastValidBlockHeight: bigint;
  }>,
  feePayer: KeyPairSigner,
  signers: KeyPairSigner[] = [],
) {
  return pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayerSigner(feePayer, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(lastestBlockhash, tx),
    (tx) => appendTransactionMessageInstructions(instructions, tx),
    (tx) => addSignersToTransactionMessage(signers, tx),
  );
}

async function sendTransaction<T extends IInstruction[]>(
  connection: {
    rpc: Rpc<SolanaRpcApi>;
    rpcSubscriptions: RpcSubscriptions<SolanaRpcSubscriptionsApi>;
  },
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
  const signedTransaction =
    await signTransactionMessageWithSigners(transactionMessage);

  await sendAndConfirmTransactionFactory(connection)(signedTransaction, {
    commitment: 'confirmed',
  });

  const signature = getSignatureFromTransaction(signedTransaction);

  return signature.toString();
}

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

// user root
//
const userRootKeypair = await generateKeyPairSigner();
await connection.rpc
  .requestAirdrop(userRootKeypair.address, lamports(BigInt(LAMPORTS_PER_SOL)))
  .send();

// user authority manager
//
const userAuthorityManagerKeypair = await generateKeyPairSigner();
await connection.rpc
  .requestAirdrop(
    userAuthorityManagerKeypair.address,
    lamports(BigInt(LAMPORTS_PER_SOL)),
  )
  .send();

// dapp authority
//
const dappAuthorityKeypair = await generateKeyPairSigner();
await connection.rpc
  .requestAirdrop(
    dappAuthorityKeypair.address,
    lamports(BigInt(LAMPORTS_PER_SOL)),
  )
  .send();

sleepSync(3000);

const id = randomBytes(32);

const swigAddress = await findSwigPda(id);

//
// * Find a swig pda by id
//
const rootActions = Actions.set().all().get();

const ix = await getCreateSwigInstruction({
  payer: userRootKeypair.address,
  actions: rootActions,
  authorityInfo: createEd25519AuthorityInfo(userRootKeypair.address),
  id,
});

await sendTransaction(connection, [ix], userRootKeypair);

sleepSync(3000);

//
// * fetch swig
//
const swig = await fetchSwig(connection.rpc, swigAddress);

//
// * find role by authority
//
const rootRole = swig.findRolesByEd25519SignerPk(userRootKeypair.address)[0];

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
  createEd25519AuthorityInfo(userAuthorityManagerKeypair.address),
  manageAuthorityActions,
);

await sendTransaction(connection, addAuthorityIx, userRootKeypair);

sleepSync(3000);

//
// * update the swig utilty with Swig.refetch
//
await swig.refetch();

const managerRole = swig.findRolesByEd25519SignerPk(
  userAuthorityManagerKeypair.address,
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
  createEd25519AuthorityInfo(dappAuthorityKeypair.address),
  dappAuthorityActions,
);

await sendTransaction(
  connection,
  addDappAuthorityInstruction,
  userAuthorityManagerKeypair,
);

await connection.rpc
  .requestAirdrop(swigAddress, lamports(BigInt(LAMPORTS_PER_SOL)))
  .send();

sleepSync(3000);

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
    new Uint8Array(getAddressEncoder().encode(dappAuthorityKeypair.address)),
  )
)
  throw new Error('Role authority is not the authority');

console.log(
  'balance before first transfer:',
  (await connection.rpc.getBalance(swigAddress).send()).value,
);

//
// * spend max sol permitted
//
let transfer = getSolTransferInstruction({
  fromAddress: swigAddress,
  toAddress: dappAuthorityKeypair.address,
  lamports: 0.1 * LAMPORTS_PER_SOL,
});

let dappAuthorityRole = swig.findRolesByEd25519SignerPk(
  dappAuthorityKeypair.address,
)[0];

let signTransfer = await getSignInstructions(swig, dappAuthorityRole.id, [
  transfer,
]);

const tx = await sendTransaction(connection, signTransfer, dappAuthorityKeypair);

console.log(`https://explorer.solana.com/tx/${tx}?cluster=custom`);

sleepSync(3000);

console.log(
  'balance after first transfer:',
  (await connection.rpc.getBalance(swigAddress).send()).value,
);

await swig.refetch();

//
// * try spend sol
//
transfer = getSolTransferInstruction({
  lamports: 0.05 * LAMPORTS_PER_SOL,
  toAddress: dappAuthorityKeypair.address,
  fromAddress: swigAddress,
});

dappAuthorityRole = swig.findRolesByEd25519SignerPk(
  dappAuthorityKeypair.address,
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
  (await connection.rpc.getBalance(swigAddress).send()).value,
);
