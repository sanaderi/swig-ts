// import {
//   getTransferSolInstructionDataEncoder,
//   SYSTEM_PROGRAM_ADDRESS,
// } from '@solana-program/system';
// import {
//   AccountRole,
//   addSignersToTransactionMessage,
//   appendTransactionMessageInstructions,
//   createSolanaRpc,
//   createTransactionMessage,
//   generateKeyPairSigner,
//   getAddressEncoder,
//   getSignatureFromTransaction,
//   lamports,
//   pipe,
//   sendTransactionWithoutConfirmingFactory,
//   setTransactionMessageFeePayerSigner,
//   setTransactionMessageLifetimeUsingBlockhash,
//   signTransactionMessageWithSigners,
//   type Address,
//   type Blockhash,
//   type IInstruction,
//   type KeyPairSigner,
//   type Rpc,
//   type SolanaRpcApi,
// } from '@solana/kit';
// import {
//   Actions,
//   createEd25519AuthorityInfo,
//   findSwigPda,
//   SolInstruction,
//   Swig,
// } from '@swig-wallet/kit-x';
// import { sleepSync } from 'bun';

// //
// // Helpers
// //
// // function formatSolLimit(limit: bigint | null): string {
// //   return limit === null
// //     ? 'unlimited'
// //     : `${Number(limit) / LAMPORTS_PER_SOL} SOL`;
// // }

// // function getInstructionsFromContext<Insts extends IInstruction[]>(
// //   swigContext: SwigInstructionContext,
// // ): Insts {
// //   return swigContext.getKitInstructions();
// // }

// function getSolTransferInstruction(args: {
//   fromAddress: Address;
//   toAddress: Address;
//   lamports: number;
// }) {
//   return {
//     programAddress: SYSTEM_PROGRAM_ADDRESS,
//     accounts: [
//       {
//         address: args.fromAddress,
//         role: AccountRole.WRITABLE_SIGNER,
//       },
//       {
//         address: args.toAddress,
//         role: AccountRole.WRITABLE,
//       },
//     ],
//     data: new Uint8Array(
//       getTransferSolInstructionDataEncoder().encode({
//         amount: args.lamports,
//       }),
//     ),
//   };
// }

// function getTransactionMessage<Inst extends IInstruction[]>(
//   instructions: Inst,
//   lastestBlockhash: Readonly<{
//     blockhash: Blockhash;
//     lastValidBlockHeight: bigint;
//   }>,
//   feePayer: KeyPairSigner,
//   signers: KeyPairSigner[] = [],
// ) {
//   return pipe(
//     createTransactionMessage({ version: 0 }),
//     (tx) => setTransactionMessageFeePayerSigner(feePayer, tx),
//     (tx) => setTransactionMessageLifetimeUsingBlockhash(lastestBlockhash, tx),
//     (tx) => appendTransactionMessageInstructions(instructions, tx),
//     (tx) => addSignersToTransactionMessage(signers, tx),
//   );
// }

// async function sendTransaction<T extends IInstruction[]>(
//   rpc: Rpc<SolanaRpcApi>,
//   instructions: T,
//   payer: KeyPairSigner,
//   signers: KeyPairSigner[] = [],
// ) {
//   const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();
//   const transactionMessage = getTransactionMessage(
//     instructions,
//     latestBlockhash,
//     payer,
//     signers,
//   );
//   const signedTransaction =
//     await signTransactionMessageWithSigners(transactionMessage);

//   await sendTransactionWithoutConfirmingFactory({ rpc })(signedTransaction, {
//     commitment: 'confirmed',
//   });

//   const signature = getSignatureFromTransaction(signedTransaction);

//   return signature.toString();
// }

// function randomBytes(length: number): Uint8Array {
//   const randomArray = new Uint8Array(length);
//   crypto.getRandomValues(randomArray);
//   return randomArray;
// }

// export function sleep(s: number): Promise<void> {
//   return new Promise((resolve) => setTimeout(resolve, s * 1000));
// }

// const LAMPORTS_PER_SOL = 1_000_000_000;

// console.log('starting...');

// const rpcUrl = 'http://localhost:8899';

// const rpc = createSolanaRpc(rpcUrl);

// // user root
// //
// let userRootKeypair = await generateKeyPairSigner();
// await rpc
//   .requestAirdrop(userRootKeypair.address, lamports(BigInt(LAMPORTS_PER_SOL)))
//   .send();

// // user authority manager
// //
// let userAuthorityManagerKeypair = await generateKeyPairSigner();
// await rpc
//   .requestAirdrop(
//     userAuthorityManagerKeypair.address,
//     lamports(BigInt(LAMPORTS_PER_SOL)),
//   )
//   .send();

// // dapp authority
// //
// let dappAuthorityKeypair = await generateKeyPairSigner();
// await rpc
//   .requestAirdrop(
//     dappAuthorityKeypair.address,
//     lamports(BigInt(LAMPORTS_PER_SOL)),
//   )
//   .send();

// await sleep(3);

// let id = randomBytes(32);

// const swigAddress = (await findSwigPda(id))[0];

// //
// // * Find a swig pda by id
// //
// // let [swigAddress] = findSwigPda(id);

// let rootActions = Actions.set().all().get();

// const ix = (
//   await Swig.create({
//     payer: userRootKeypair.address,
//     actions: rootActions,
//     authorityInfo: createEd25519AuthorityInfo(userRootKeypair.address),
//     id,
//   })
// ).toKitInstruction();

// await sendTransaction(rpc, [ix], userRootKeypair);

// await sleep(3);

// //
// // * fetch swig
// //
// let swig = await Swig.fetch(rpcUrl, swigAddress);

// //
// // * find role by authority
// //
// let rootRole = (
//   await swig.findRolesByEd25519SignerPk(userRootKeypair.address, {
//     prefetch: true,
//   })
// )[0];

// //
// // * helper for creating actions
// //
// let manageAuthorityActions = Actions.set().manageAuthority().get();

// //
// // * can call instructions associated with a role (or authority)
// //
// // * role.removeAuthority
// // * role.replaceAuthority
// // * role.sign
// //
// let addAuthorityIx = await swig.addAuthorityInstruction(
//   rootRole,
//   createEd25519AuthorityInfo(userAuthorityManagerKeypair.address),
//   manageAuthorityActions,
// );

// await sendTransaction(
//   rpc,
//   addAuthorityIx.getKitInstructions(),
//   userRootKeypair,
// );

// await sleep(3);

// //
// // * update the swig utilty with Swig.refetch
// //
// await swig.refetch();

// let managerRole = (
//   await swig.findRolesByEd25519SignerPk(userAuthorityManagerKeypair.address)
// )[0];

// if (!managerRole) throw new Error('Role not found for authority');

// //
// // * perform actions check on a role
// //
// // * role.hasAllAction
// // * role.canSpendSol
// // * role.canSpendToken
// // * e.t.c
// // //
// // if (!managerRole.canManageAuthority())
// //   throw new Error('Selected role cannot manage authority');

// //
// // * allocate 0.1 max sol spend, for the dapp
// //
// let dappAuthorityActions = Actions.set()
//   .solLimit({ amount: BigInt(0.1 * LAMPORTS_PER_SOL) })
//   .get();

// //
// // * makes the dapp an authority
// //
// let addDappAuthorityInstruction = await swig.addAuthorityInstruction(
//   managerRole,
//   // userAuthorityManagerKeypair.publicKey,
//   createEd25519AuthorityInfo(dappAuthorityKeypair.address),
//   dappAuthorityActions,
// );

// await sendTransaction(
//   rpc,
//   addDappAuthorityInstruction.getKitInstructions(),
//   userAuthorityManagerKeypair,
// );

// await rpc
//   .requestAirdrop(swigAddress, lamports(BigInt(LAMPORTS_PER_SOL)))
//   .send();

// await sleep(3);

// await swig.refetch();

// //
// // * role array methods (we check what roles can spend sol)
// //
// console.log(
//   'Has ability to spend sol:',
//   swig.roles.map((role) => role.actions.canSpendSol()),
// );
// console.log(
//   'Can spend 0.1 sol:',
//   swig.roles.map((role) =>
//     role.actions.canSpendSol(BigInt(0.1 * LAMPORTS_PER_SOL)),
//   ),
// );
// console.log(
//   'Can spend 0.11 sol:',
//   swig.roles.map((role) =>
//     role.actions.canSpendSol(BigInt(0.11 * LAMPORTS_PER_SOL)),
//   ),
// );

// let roleIdCanSpendSol = swig.roles
//   .filter((role) => role.actions.canSpendSol(BigInt(0.1 * LAMPORTS_PER_SOL)))
//   .map((role) => role.id);

// //
// // * find a role by id
// //
// let maybeDappRole = await swig.findRoleById(roleIdCanSpendSol[1]);
// if (!maybeDappRole) throw new Error('Role does not exist');

// //
// // * check if the authority on a role matches
// //
// if (
//   !maybeDappRole.authority.matchesSigner(
//     new Uint8Array(getAddressEncoder().encode(dappAuthorityKeypair.address)), // todo: make this SolanaPublicKeyData
//   )
// )
//   throw new Error('Role authority is not the authority');

// console.log(
//   'balance before first transfer:',
//   await rpc.getBalance(swigAddress).send(),
// );

// //
// // * spend max sol permitted
// //
// // let transfer = SystemProgram.transfer({
// //   fromPubkey: swigAddress,
// //   toPubkey: dappAuthorityKeypair.publicKey,
// //   lamports: 0.1 * LAMPORTS_PER_SOL,
// // });

// let transfer = getSolTransferInstruction({
//   fromAddress: swigAddress,
//   toAddress: dappAuthorityKeypair.address,
//   lamports: 0.1 * LAMPORTS_PER_SOL,
// });

// let dappAuthorityRole = (
//   await swig.findRolesByEd25519SignerPk(dappAuthorityKeypair.address)
// )[0];

// let signTransfer = await swig.signInstruction(dappAuthorityRole, [
//   SolInstruction.fromKitInstruction(transfer),
// ]);

// let tx = await sendTransaction(
//   rpc,
//   signTransfer.getKitInstructions(),
//   dappAuthorityKeypair,
// );

// console.log(`https://explorer.solana.com/tx/${tx}?cluster=custom`);

// await sleep(3);

// console.log(
//   'balance after first transfer:',
//   await rpc.getBalance(swigAddress).send(),
// );

// await swig.refetch();

// //
// // * try spend sol
// //
// transfer = getSolTransferInstruction({
//   lamports: 0.05 * LAMPORTS_PER_SOL,
//   toAddress: dappAuthorityKeypair.address,
//   fromAddress: swigAddress,
// });

// dappAuthorityRole = (
//   await swig.findRolesByEd25519SignerPk(dappAuthorityKeypair.address)
// )[0];

// signTransfer = await swig.signInstruction(dappAuthorityRole, [
//   SolInstruction.fromKitInstruction(transfer),
// ]);

// await sendTransaction(
//   rpc,
//   signTransfer.getKitInstructions(),
//   dappAuthorityKeypair,
// )
//   .then(() => {
//     throw new Error(
//       'Transaction succeeded! Dapp authority spent more than allowed',
//     );
//   })
//   .catch(() =>
//     console.log('Transaction failed after tying to spend more than allowance!'),
//   );

// sleepSync(3000);

// console.log(
//   'balance after second transfer:',
//   await rpc.getBalance(swigAddress).send(),
// );
