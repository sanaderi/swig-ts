import {
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  generateKeyPairSigner,
  getSignatureFromTransaction,
  lamports,
  pipe,
  sendAndConfirmTransactionFactory,
  signTransactionMessageWithSigners,
  createTransactionMessage,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstructions,
  addSignersToTransactionMessage,
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
  getSignInstructions,
} from '@swig-wallet/kit';

import {
  TOKEN_2022_PROGRAM_ADDRESS,
  findAssociatedTokenPda,
  getCreateAssociatedTokenInstructionAsync,
  getInitializeMintInstruction,
  getMintSize,
  getMintToCheckedInstruction,
  getTransferCheckedInstruction,
} from '@solana-program/token-2022';

import { getCreateAccountInstruction } from '@solana-program/system';

import chalk from 'chalk';
import { sleepSync } from 'bun';

function randomBytes(length: number): Uint8Array {
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  return arr;
}

async function sendTransaction(
  instructions: IInstruction[],
  payer: KeyPairSigner,
  signers: KeyPairSigner[] = []
): Promise<string> {
  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();
  const txMsg = pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayerSigner(payer, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
    (tx) => appendTransactionMessageInstructions(instructions, tx),
    (tx) => addSignersToTransactionMessage(signers, tx)
  );

  const signedTx = await signTransactionMessageWithSigners(txMsg);
  await sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions })(signedTx, {
    commitment: 'confirmed',
  });
  return getSignatureFromTransaction(signedTx).toString();
}

const rpc = createSolanaRpc('http://localhost:8899');
const rpcSubscriptions = createSolanaRpcSubscriptions('ws://localhost:8900');

(async () => {
  console.log(chalk.blue('🚀 Starting tutorial - Token Authority and Transfers (Kit Style)'));

  const rootUser = await generateKeyPairSigner();
  await rpc.requestAirdrop(rootUser.address, lamports(100n * 1_000_000_000n)).send();
  sleepSync(2000);
  console.log(chalk.green('👤 Root user public key:'), chalk.cyan(rootUser.address.toString()));

  const id = randomBytes(32);
  const swigAddress = await findSwigPda(id);
  const rootAuthorityInfo = createEd25519AuthorityInfo(rootUser.address);
  const rootActions = Actions.set().manageAuthority().get();

  const createSwigIx = await getCreateSwigInstruction({
    payer: rootUser.address,
    id,
    actions: rootActions,
    authorityInfo: rootAuthorityInfo,
  });

  await sendTransaction([createSwigIx], rootUser);
  console.log(chalk.green('✓ Swig account created at:'), chalk.cyan(swigAddress.toString()));

  await rpc.requestAirdrop(swigAddress, lamports(1n)).send();
  sleepSync(2000);
  console.log(chalk.green('✓ Airdropped 1 SOL to Swig account'));

  const mint = await generateKeyPairSigner();
  const mintAuthority = rootUser;
  const decimals = 0;

  const rent = await rpc.getMinimumBalanceForRentExemption(BigInt(getMintSize())).send();

  const createMintAccountIx = getCreateAccountInstruction({
    payer: mintAuthority,
    newAccount: mint,
    lamports: rent,
    space: BigInt(getMintSize()),
    programAddress: TOKEN_2022_PROGRAM_ADDRESS,
  });

  const initMintIx = getInitializeMintInstruction({
    mint: mint.address,
    decimals,
    mintAuthority: mintAuthority.address,
  });

  const [swigATA] = await findAssociatedTokenPda({
    mint: mint.address,
    owner: swigAddress,
    tokenProgram: TOKEN_2022_PROGRAM_ADDRESS,
  });

  const createSwigATAIx = await getCreateAssociatedTokenInstructionAsync({
    payer: mintAuthority,
    mint: mint.address,
    owner: swigAddress,
  });

  const mintToSwigIx = await getMintToCheckedInstruction({
    mint: mint.address,
    token: swigATA,
    mintAuthority,
    amount: 10n,
    decimals,
  });

  await sendTransaction(
    [createMintAccountIx, initMintIx, createSwigATAIx, mintToSwigIx],
    mintAuthority,
    [mint]
  );
  console.log(chalk.green('✓ Token mint and Swig ATA created and funded'));

  const recipient = await generateKeyPairSigner();
  const [recipientATA] = await findAssociatedTokenPda({
    mint: mint.address,
    owner: recipient.address,
    tokenProgram: TOKEN_2022_PROGRAM_ADDRESS,
  });

  const createRecipientATAIx = await getCreateAssociatedTokenInstructionAsync({
    payer: rootUser,
    mint: mint.address,
    owner: recipient.address,
  });

  await sendTransaction([createRecipientATAIx], rootUser);
  console.log(chalk.green('✓ Recipient ATA created'));

  const tokenAuthority = await generateKeyPairSigner();
  await rpc.requestAirdrop(tokenAuthority.address, lamports(1n)).send();
  sleepSync(2000);

  const tokenActions = Actions.set()
    .tokenLimit({ mint: mint.address, amount: 10n })
    .get();

  const swig = await fetchSwig(rpc, swigAddress);
  const rootRole = swig.findRolesByEd25519SignerPk(rootUser.address)[0];

  const addAuthorityIxs = await getAddAuthorityInstructions(
    swig,
    rootRole.id,
    createEd25519AuthorityInfo(tokenAuthority.address),
    tokenActions
  );

  await sendTransaction(addAuthorityIxs, rootUser);
  console.log(chalk.green('✓ Token authority added'));

  //check how much sol the swig has
  const swigBalance = await rpc.getBalance(swigAddress).send();
  console.log(chalk.green('✓ Swig account balance:'), chalk.cyan(swigBalance.value.toString()));

  // Add balance checks for Swig ATA and Recipient ATA
  const swigATABalance = await rpc.getTokenAccountBalance(swigATA).send();
  console.log(chalk.green('✓ Swig ATA balance:'), chalk.cyan(swigATABalance.value.amount));

  const recipientATABalance = await rpc.getTokenAccountBalance(recipientATA).send();
  console.log(chalk.green('✓ Recipient ATA balance:'), chalk.cyan(recipientATABalance.value.amount));

  // ❌ Second transfer (should fail)
  try {
    const swigLatest = await fetchSwig(rpc, swigAddress);
    const role = swigLatest.findRolesByEd25519SignerPk(tokenAuthority.address)[0];

    const transferAgain = getTransferCheckedInstruction({
      source: swigATA,
      destination: recipientATA,
      mint: mint.address,
      amount: 10n,
      decimals,
      authority: swigAddress,
    });

    const signed = await getSignInstructions(swigLatest, role.id, [transferAgain]);
    await sendTransaction(signed, tokenAuthority);
    console.error(chalk.red('✗ Second transfer unexpectedly succeeded!'));
  } catch {
    console.log(chalk.green('✓ Second transfer failed as expected (no allowance left)'));
  }

  console.log(chalk.green('\n✨ Tutorial completed successfully!'));
  console.log(
    chalk.yellow('🔍 View your Swig on Explorer:'),
    chalk.cyan(
      `https://explorer.solana.com/address/${swigAddress}?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899`
    )
  );
})();
