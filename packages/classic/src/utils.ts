import { AccountRole, address, type IAccountMeta } from '@solana/kit';
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  type AccountMeta,
  type Commitment,
} from '@solana/web3.js';
import { SWIG_PROGRAM_ADDRESS } from './consts';
import { hexToBytes } from '@noble/curves/abstract/utils';
import { secp256k1 } from '@noble/curves/secp256k1';
import { keccak_256 } from '@noble/hashes/sha3';

/**
 * Creates a SWIG Instruction with the swig program addresss
 */
export function swigInstruction<T extends AccountMeta[]>(
  accounts: T,
  data: Uint8Array,
): TransactionInstruction {
  return new TransactionInstruction({
    programId: SWIG_PROGRAM_ADDRESS,
    keys: accounts,
    data: Buffer.from(data),
  });
}

export function uint8ArraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}

export function convertKeysToMetas(meta: AccountMeta): IAccountMeta {
  return {
    address: address(meta.pubkey.toBase58()),
    role: getRoleFromMetas(meta),
  };
}

export function getRoleFromMetas({
  isSigner,
  isWritable,
}: {
  isSigner: boolean;
  isWritable: boolean;
}) {
  if (isWritable && isSigner) {
    return AccountRole.WRITABLE_SIGNER;
  }
  if (isWritable && !isSigner) {
    return AccountRole.WRITABLE;
  }
  if (!isWritable && isSigner) {
    return AccountRole.READONLY_SIGNER;
  }

  return AccountRole.READONLY;
}

export async function createLegacyTransaction(
  connection: Connection,
  instructions: TransactionInstruction[],
  feePayer: PublicKey,
  options?: { commitment?: Commitment },
): Promise<Transaction> {
  let transaction = new Transaction();

  transaction.instructions = instructions;
  transaction.feePayer = feePayer;
  transaction.recentBlockhash = (
    await connection.getLatestBlockhash(options)
  ).blockhash;

  return transaction;
}

/**
 * Utility for deriving a Swig PDA
 * @param id Swig ID
 * @returns [PublicKey, number]
 */
export function findSwigPda(id: Uint8Array): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('swig'), Buffer.from(id)],
    SWIG_PROGRAM_ADDRESS,
  );
}

export function compressedPubkeyToAddress(
  compressed: Uint8Array | string,
): `0x${string}` {
  const compressedBytes =
    typeof compressed === 'string' ? hexToBytes(compressed) : compressed;

  const point = secp256k1.ProjectivePoint.fromHex(compressedBytes);

  const uncompressed = point.toRawBytes(false).slice(1); // remove 0x04 prefix

  // Keccak hash
  const hash = keccak_256(uncompressed);

  // Last 20 bytes
  const address = `0x${hash.slice(-40)}` as const;

  return address;
}
