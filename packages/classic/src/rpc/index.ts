import {
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  TransactionInstruction,
  type Commitment,
  type Connection,
  type GetAccountInfoConfig,
  type Signer,
  type TransactionSignature,
} from '@solana/web3.js';
import type { SwigActions } from '../actions';
import type { Authority } from '../authority';
import { Swig } from '../kit';
import { createLegacyTransaction } from '../utils';

export async function createSwig(
  connection: Connection,
  id: Uint8Array,
  authority: Authority,
  startSlot: bigint,
  endSlot: bigint,
  payer: PublicKey,
  signers: Array<Signer>,
  options?: { commitment?: Commitment },
): Promise<TransactionSignature> {
  let createInstruction = Swig.create({
    authority,
    endSlot,
    payer,
    startSlot,
    id,
  });

  let transaction = await createLegacyTransaction(
    connection,
    [createInstruction],
    payer,
    options,
  );

  return sendAndConfirmTransaction(connection, transaction, signers, options);
}

export function fetchNullableSwig(
  connection: Connection,
  swigAddress: PublicKey,
  config?: GetAccountInfoConfig,
): Promise<Swig | null> {
  return Swig.fetchNullable(connection, swigAddress, config);
}

export function fetchSwig(
  connection: Connection,
  swigAddress: PublicKey,
  config?: GetAccountInfoConfig,
): Promise<Swig> {
  return Swig.fetch(connection, swigAddress, config);
}

export async function getSignInstruction(
  connection: Connection,
  instructons: TransactionInstruction[],
  swigAddress: PublicKey,
  authority: Authority,
  payer: PublicKey,
  options?: { commitment: Commitment },
): Promise<TransactionInstruction> {
  let swig = await fetchSwig(connection, swigAddress, options);

  let role = swig.findRoleByAuthority(authority);

  if (!role) {
    throw new Error("Authority doesn't have a role on the swig");
  }

  return role.sign({ payer, innerInstructions: instructons });
}

export async function signAndSend(
  connection: Connection,
  instructons: TransactionInstruction[],
  swigAddress: PublicKey,
  authority: Authority,
  payer: PublicKey,
  signers: Signer[],
  options?: { commitment: Commitment },
): Promise<TransactionSignature> {
  let signInstruction = await getSignInstruction(
    connection,
    instructons,
    swigAddress,
    authority,
    payer,
    options,
  );

  // todo: option for sending versioned
  let transaction = await createLegacyTransaction(
    connection,
    [signInstruction],
    payer,
    options,
  );

  return sendAndConfirmTransaction(connection, transaction, signers, options);
}

/**
 *
 * @param connection
 * @param swigAddress
 * @param authority
 * @param newAuthority
 * @param actions
 * @param startSlot
 * @param endSlot
 * @param payer
 * @param signers
 * @param options
 * @returns
 */
export async function addAuthority(
  connection: Connection,
  swigAddress: PublicKey,
  authority: Authority,
  newAuthority: Authority,
  actions: SwigActions,
  startSlot: bigint,
  endSlot: bigint,
  payer: Keypair,
  signers: Signer[] = [],
  options?: { commitment: Commitment },
): Promise<TransactionSignature> {
  let swig = await fetchSwig(connection, swigAddress, options);

  let role = swig.findRoleByAuthority(authority);

  if (!role) {
    throw new Error("Authority doesn't have a role on the swig");
  }

  if (!role.canManageAuthority())
    throw new Error('Role cannot manage authorities on the swig');

  let addAuthorityIx = role.addAuthority({
    payer: payer.publicKey,
    actions,
    endSlot,
    startSlot,
    newAuthority,
  });

  // todo: option for sending versioned
  let transaction = await createLegacyTransaction(
    connection,
    [addAuthorityIx],
    payer.publicKey,
    options,
  );

  transaction.sign(payer, ...signers);

  return sendAndConfirmTransaction(connection, transaction, [], options);
}

export async function removeAuthority(
  connection: Connection,
  swigAddress: PublicKey,
  authority: Authority,
  authorityToRemove: Authority,
  payer: Keypair,
  signers: Signer[] = [],
  options?: { commitment: Commitment },
): Promise<TransactionSignature> {
  let swig = await fetchSwig(connection, swigAddress, options);

  let role = swig.findRoleByAuthority(authority);

  if (!role) {
    throw new Error("Authority doesn't have a role on the swig");
  }

  if (!role.canManageAuthority())
    throw new Error('Role cannot manage authorities on the swig');

  let roleToRemove = swig.findRoleByAuthority(authorityToRemove);

  if (!roleToRemove) {
    throw new Error('Authority role does not exist on the swig');
  }

  let removeAuthorityIx = role.removeAuthority({
    payer: payer.publicKey,
    roleToRemove,
  });

  // todo: option for sending versioned
  let transaction = await createLegacyTransaction(
    connection,
    [removeAuthorityIx],
    payer.publicKey,
    options,
  );

  transaction.sign(payer, ...signers);

  return sendAndConfirmTransaction(connection, transaction, [], options);
}

export async function replaceAuthority(
  connection: Connection,
  swigAddress: PublicKey,
  authority: Authority,
  authorityToReplace: Authority,
  newAuthority: Authority,
  actions: SwigActions,
  startSlot: bigint,
  endSlot: bigint,
  payer: Keypair,
  signers: Signer[] = [],
  options?: { commitment: Commitment },
): Promise<TransactionSignature> {
  let swig = await fetchSwig(connection, swigAddress, options);

  let role = swig.findRoleByAuthority(authority);

  if (!role) {
    throw new Error("Authority doesn't have a role on the swig");
  }

  if (!role.canManageAuthority())
    throw new Error('Role cannot manage authorities on the swig');

  let roleToReplace = swig.findRoleByAuthority(authorityToReplace);

  if (!roleToReplace) {
    throw new Error('Authority role to replace does not exist on the swig');
  }

  let replaceAuthorityIx = role.replaceAuthority({
    payer: payer.publicKey,
    actions,
    endSlot,
    startSlot,
    roleToReplace,
    newAuthority
  });

  // todo: option for sending versioned
  let transaction = await createLegacyTransaction(
    connection,
    [replaceAuthorityIx],
    payer.publicKey,
    options,
  );

  transaction.sign(payer, ...signers);

  return sendAndConfirmTransaction(connection, transaction, [], options);
}

