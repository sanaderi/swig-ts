import {
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    Transaction,
    sendAndConfirmTransaction,
  } from "@solana/web3.js";
  import {
    Swig,
    Actions,
    Secp256k1Authority,
    getSigningFnForSecp256k1PrivateKey,
    findSwigPda,
    addAuthorityInstruction,
    fetchSwig,
    type InstructionDataOptions,
  } from "@swig-wallet/classic";
  import { Wallet } from "@ethereumjs/wallet";
  import { secp256k1 } from "@noble/curves/secp256k1";
  import { bytesToHex } from "@noble/curves/abstract/utils";
  
  function sleep(s: number) {
    return new Promise((r) => setTimeout(r, s * 1000));
  }
  
  (async () => {
    const connection = new Connection("http://localhost:8899", "confirmed");
  
    // Root payer for fees
    const payer = Keypair.generate();
    await connection.requestAirdrop(payer.publicKey, LAMPORTS_PER_SOL);
    await sleep(2);
  

    const evmWallet = Wallet.generate();
    const pubkey = secp256k1.getPublicKey(evmWallet.getPrivateKey(), false);
    const authority = Secp256k1Authority.fromPublicKeyString(bytesToHex(pubkey));
    const signingFn = getSigningFnForSecp256k1PrivateKey(evmWallet.getPrivateKey());
  
    const swigId = Uint8Array.from(Array(32).fill(7));
    const [swigAddress] = findSwigPda(swigId);
  
    const slot = await connection.getSlot("finalized");
    const instOptions: InstructionDataOptions = {
      currentSlot: BigInt(slot),
      signingFn,
    };
  
    // Create Swig
    const ix = await Swig.create(
      {
        id: swigId,
        payer: payer.publicKey,
        authority,
        actions: Actions.set().all().get(),
      },
    );
  
    const createTx = new Transaction().add(ix);
    await sendAndConfirmTransaction(connection, createTx, [payer]);
    console.log("Swig created at:", swigAddress.toBase58());
  
    // Fetch Swig and get root role
    await sleep(2);
    const swig = await fetchSwig(connection, swigAddress);
    const rootRole = swig.findRoleByAuthority(authority);
    if (!rootRole) throw new Error("Root role not found");
  
    const rolesToCreate = [
      { name: "data-entry", amount: 0.05 },
      { name: "finance", amount: 0.1 },
      { name: "developer", amount: 0.2 },
      { name: "moderator", amount: 0.05 },
    ];
  
    for (const { name, amount } of rolesToCreate) {
      const actions = Actions.set()
        .solLimit({ amount: BigInt(amount * LAMPORTS_PER_SOL) })
        .get();
  
      const ix = await addAuthorityInstruction(
        rootRole,
        payer.publicKey,
        authority,
        actions,
        instOptions
      );
  
      const tx = new Transaction().add(ix);
      const sig = await sendAndConfirmTransaction(connection, tx, [payer]);
  
      console.log(`Role '${name}' added`);
      console.log(` Tx: https://explorer.solana.com/tx/${sig}?cluster=custom`);
    }
  
    console.log("All roles created using the same EVM wallet.");
  })();
  