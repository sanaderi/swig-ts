import {
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  generateKeyPairSigner,
  lamports,
  pipe,
  createTransactionMessage,
  sendAndConfirmTransactionFactory,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstructions,
  signTransactionMessageWithSigners,
  getSignatureFromTransaction,
  addSignersToTransactionMessage,
} from '@solana/kit';

import {
  findAssociatedTokenPda,
  getCreateAssociatedTokenInstructionAsync,
  getInitializeMintInstruction,
  getMintToCheckedInstruction,
  getTransferCheckedInstruction,
  getMintSize,
  TOKEN_PROGRAM_ADDRESS,
} from '@solana-program/token';

import {
  getCreateAccountInstruction,
} from '@solana-program/system';

import {
  findSwigPda,
  getCreateSwigInstruction,
  getAddAuthorityInstructions,
  getSignInstructions,
  createEd25519AuthorityInfo,
  fetchSwig,
  Actions,
} from '@swig-wallet/kit';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomBytes(length: number): Uint8Array {
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  return arr;
}

const connection = {
  rpc: createSolanaRpc('http://localhost:8899'),
  rpcSubscriptions: createSolanaRpcSubscriptions('ws://localhost:8900'),
};

const DECIMALS = 6;

// Helper to send instructions
async function sendTx(instructions: any[], feePayer: any, signers: any[] = []) {
  const { value: blockhash } = await connection.rpc.getLatestBlockhash().send();

  const tx = pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayerSigner(feePayer, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(blockhash, tx),
    (tx) => appendTransactionMessageInstructions(instructions, tx),
    (tx) => addSignersToTransactionMessage(signers, tx)
  );

  const signed = await signTransactionMessageWithSigners(tx);
  await sendAndConfirmTransactionFactory(connection)(signed, { commitment: 'confirmed' });
  return getSignatureFromTransaction(signed).toString();
}

// Main logic
(async () => {
  const userRoot = await generateKeyPairSigner();
  const userMgr = await generateKeyPairSigner();
  const devWallet = await generateKeyPairSigner();
  const usdcMint = await generateKeyPairSigner();
  const recipient = await generateKeyPairSigner();

  // Ensure all accounts are properly funded
  const accountsToFund = [userRoot.address, userMgr.address, devWallet.address, recipient.address];
  for (const account of accountsToFund) {
    const requiredLamports = lamports(1_000_000_000n); // 1 SOL
    await connection.rpc.requestAirdrop(account, requiredLamports).send();
  }
  await sleep(3000);

  // Swig setup
  const id = randomBytes(32);
  const swigAddr = await findSwigPda(id);

  const swigIx = await getCreateSwigInstruction({
    payer: userRoot.address,
    id,
    authorityInfo: createEd25519AuthorityInfo(userRoot.address),
    actions: Actions.set().all().get(),
  });

  await sendTx([swigIx], userRoot);
  await sleep(3000);
  const swig = await fetchSwig(connection.rpc, swigAddr);

  const mgrIx = await getAddAuthorityInstructions(
    swig,
    swig.findRolesByEd25519SignerPk(userRoot.address)[0].id,
    createEd25519AuthorityInfo(userMgr.address),
    Actions.set().manageAuthority().get()
  );
  await sendTx(mgrIx, userRoot);

  const mintSize = BigInt(getMintSize());
  const rent = await connection.rpc.getMinimumBalanceForRentExemption(mintSize).send();

  const createMintIx = getCreateAccountInstruction({
    payer: devWallet,
    newAccount: usdcMint,
    lamports: rent,
    space: mintSize,
    programAddress: TOKEN_PROGRAM_ADDRESS,
  });

  const initMintIx = getInitializeMintInstruction({
    mint: usdcMint.address,
    decimals: DECIMALS,
    mintAuthority: devWallet.address,
  });

  const [swigAta] = await findAssociatedTokenPda({
    mint: usdcMint.address,
    owner: swigAddr,
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
  });

  const [recipAta] = await findAssociatedTokenPda({
    mint: usdcMint.address,
    owner: recipient.address,
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
  });

  const createSwigAtaIx = await getCreateAssociatedTokenInstructionAsync({
    payer: devWallet,
    mint: usdcMint.address,
    owner: swigAddr,
  });

  const createRecipAtaIx = await getCreateAssociatedTokenInstructionAsync({
    payer: devWallet,
    mint: usdcMint.address,
    owner: recipient.address,
  });

  const mintToIx = await getMintToCheckedInstruction({
    mint: usdcMint.address,
    token: swigAta,
    mintAuthority: devWallet,
    amount: 1000_000n,
    decimals: DECIMALS,
  });

  await sendTx([
    createMintIx,
    initMintIx,
    createSwigAtaIx,
    createRecipAtaIx,
    mintToIx,
  ], devWallet);

  await swig.refetch();

  const devIx = await getAddAuthorityInstructions(
    swig,
    swig.findRolesByEd25519SignerPk(userMgr.address)[0].id,
    createEd25519AuthorityInfo(devWallet.address),
    Actions.set().tokenLimit({ mint: usdcMint.address, amount: 1000_000n }).get()
  );
  await sendTx(devIx, userMgr);
  await swig.refetch();

  const devRole = swig.findRolesByEd25519SignerPk(devWallet.address)[0];
  const transferIx = getTransferCheckedInstruction({
    source: swigAta,
    destination: recipAta,
    mint: usdcMint.address,
    authority: swigAddr,
    amount: 250_000n,
    decimals: DECIMALS,
  });

  const signIxs = await getSignInstructions(swig, devRole.id, [transferIx]);
  const sig = await sendTx(signIxs, devWallet);

  console.log(`Tx hash: https://explorer.solana.com/tx/${sig}?cluster=custom`);
})();