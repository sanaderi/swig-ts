import {
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  generateKeyPairSigner,
  lamports,
  pipe,
  sendAndConfirmTransactionFactory,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstructions,
  addSignersToTransactionMessage,
  createTransactionMessage,
  signTransactionMessageWithSigners,
  getSignatureFromTransaction,
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

function sleepSync(ms: number): void {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    // Busy wait
  }
}

function randomBytes(length: number): Uint8Array {
  const randomArray = new Uint8Array(length);
  crypto.getRandomValues(randomArray);
  return randomArray;
}

const LAMPORTS_PER_SOL = 1_000_000_000;

(async () => {
  const connection = {
    rpc: createSolanaRpc('http://localhost:8899'),
    rpcSubscriptions: createSolanaRpcSubscriptions('ws://localhost:8900'),
  };

  const rootKeypair = await generateKeyPairSigner();
  await connection.rpc
    .requestAirdrop(rootKeypair.address, lamports(BigInt(LAMPORTS_PER_SOL)))
    .send();

  sleepSync(2000);

  const swigId = randomBytes(32);
  const swigAddress = await findSwigPda(swigId);

  const rootActions = Actions.set().all().get();
  const createSwigIx = await getCreateSwigInstruction({
    actions: rootActions,
    id: swigId,
    authorityInfo: createEd25519AuthorityInfo(rootKeypair.address),
    payer: rootKeypair.address,
  });

  const sendTransaction = async (
    instructions: IInstruction[],
    payer: KeyPairSigner,
    signers: KeyPairSigner[] = []
  ) => {
    const { value: latestBlockhash } = await connection.rpc
      .getLatestBlockhash()
      .send();
    const transactionMessage = pipe(
      createTransactionMessage({ version: 0 }),
      (tx) => setTransactionMessageFeePayerSigner(payer, tx),
      (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
      (tx) => appendTransactionMessageInstructions(instructions, tx),
      (tx) => addSignersToTransactionMessage(signers, tx)
    );
    const signedTransaction = await signTransactionMessageWithSigners(
      transactionMessage
    );
    await sendAndConfirmTransactionFactory(connection)(signedTransaction, {
      commitment: 'confirmed',
    });
    return getSignatureFromTransaction(signedTransaction).toString();
  };

  await sendTransaction([createSwigIx], rootKeypair);

  sleepSync(2000);

  const swig = await fetchSwig(connection.rpc, swigAddress);
  const rootRoles = swig.findRolesByEd25519SignerPk(rootKeypair.address);
  if (!rootRoles.length) throw new Error('Root role not found');
  const rootRole = rootRoles[0];

  const rolesToCreate = [
    { name: 'data-entry', amount: 0.05 },
    { name: 'finance', amount: 0.1 },
    { name: 'developer', amount: 0.2 },
    { name: 'moderator', amount: 0.05 },
  ];

  for (const { name, amount } of rolesToCreate) {
    const roleKeypair = await generateKeyPairSigner();

    const actions = Actions.set()
      .solLimit({ amount: BigInt(amount * LAMPORTS_PER_SOL) })
      .get();

    const addAuthorityIx = await getAddAuthorityInstructions(
      swig,
      rootRole.id,
      createEd25519AuthorityInfo(roleKeypair.address),
      actions
    );

    const tx = await sendTransaction(addAuthorityIx, rootKeypair);
    console.log(
      `[${name}] Added role with tx: https://explorer.solana.com/tx/${tx}?cluster=custom`
    );
    console.log(`[${name}] Public Key: ${roleKeypair.address}`);
  }

  console.log('All roles created successfully.');
})();
