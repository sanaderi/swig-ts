import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import {
  Actions,
  addAuthorityInstruction,
  createSwig,
  Ed25519Authority,
  fetchSwig,
  findSwigPda,
  signInstruction,
} from '@swig/classic';

//helpers
async function sendAndConfirm(
  conn: Connection,
  ix: TransactionInstruction,
  feePayer: Keypair,
  extra: Keypair[] = [],
) {
  const tx = new Transaction().add(ix);
  tx.feePayer = feePayer.publicKey;
  const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.sign(feePayer, ...extra);

  const sig = await conn.sendRawTransaction(tx.serialize(), {
    skipPreflight: true,
  });
  await conn.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed');
  return sig;
}

//config
const conn       = new Connection('http://localhost:8899', 'confirmed');
const userRoot   = Keypair.generate();
const userMgr    = Keypair.generate();
const devWallet  = Keypair.generate();
const recipient  = Keypair.generate();

for (const kp of [userRoot, userMgr, devWallet, recipient])
  await conn.requestAirdrop(kp.publicKey, LAMPORTS_PER_SOL);
await new Promise(r => setTimeout(r, 3_000));

//swig setup
const id          = crypto.getRandomValues(new Uint8Array(32));
const [swigAddr]  = findSwigPda(id);
const rootAuth    = Ed25519Authority.fromPublicKey(userRoot.publicKey);

await createSwig(conn, id, rootAuth, Actions.set().all().get(), userRoot.publicKey, [userRoot]);
await new Promise(r => setTimeout(r, 3_000));
let swig = await fetchSwig(conn, swigAddr);

//manage role
const mgrAuth = Ed25519Authority.fromPublicKey(userMgr.publicKey);
const mgrIx   = await addAuthorityInstruction(
  swig.findRoleByAuthority(rootAuth)!,
  userRoot.publicKey,
  mgrAuth,
  Actions.set().manageAuthority().get(),
);
await sendAndConfirm(conn, mgrIx, userRoot);

//create a test-USDC mint
const DECIMALS = 6;
const usdcMint = await createMint(conn, devWallet, devWallet.publicKey, null, DECIMALS);

const swigUsdcAta = await getOrCreateAssociatedTokenAccount(conn, devWallet, usdcMint, swigAddr, true);
const recipUsdcAta = await getOrCreateAssociatedTokenAccount(conn, devWallet, usdcMint, recipient.publicKey);

await mintTo(conn, devWallet, usdcMint, swigUsdcAta.address, devWallet.publicKey, 1_000 * 10 ** DECIMALS);


await swig.refetch(conn);

const devAuth   = Ed25519Authority.fromPublicKey(devWallet.publicKey);
const devRoleIx = await addAuthorityInstruction(
  swig.findRoleByAuthority(mgrAuth)!,
  userMgr.publicKey,
  devAuth,
  Actions.set()
    .tokenLimit({
      mint: usdcMint,
      amount: BigInt(1_000 * 10 ** DECIMALS),
    })
    .get(),
);
await sendAndConfirm(conn, devRoleIx, userMgr);

//transfer USDC to recipient
await swig.refetch(conn);

const devRole = swig.findRoleByAuthority(devAuth)!;
const xferIx  = createTransferInstruction(
  swigUsdcAta.address,
  recipUsdcAta.address,
  swigAddr,
  250 * 10 ** DECIMALS,
  [],
  TOKEN_PROGRAM_ID,
);
const signed  = await signInstruction(devRole, devWallet.publicKey, [xferIx]);

const sig = await sendAndConfirm(conn, signed, devWallet);
console.log(`https://explorer.solana.com/tx/${sig}?cluster=custom`);

console.log(
  'Swig USDC balance:',
  (await conn.getTokenAccountBalance(swigUsdcAta.address)).value.uiAmount,
);
console.log(
  'Recipient USDC balance:',
  (await conn.getTokenAccountBalance(recipUsdcAta.address)).value.uiAmount,
);
