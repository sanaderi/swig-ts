import type {
  Address,
  IAccountMeta,
  IInstruction,
  IInstructionWithAccounts,
  IInstructionWithData,
} from '@solana/kit';
import { SWIG_PROGRAM_ADDRESS } from './consts';

/**
 * Creates a SWIG Instruction with the swig program addresss
 */
export function swigInstruction<T extends IAccountMeta[] = IAccountMeta[]>(
  accounts: T,
  data: Uint8Array,
): SwigInstruction<T> {
  return createGenericInstruction(SWIG_PROGRAM_ADDRESS, accounts, data);
}

/**
 * create a generic Instruction
 */
export function createGenericInstruction<
  T extends string,
  U extends IAccountMeta[],
>(
  programAddress: Address<T>,
  accounts: U,
  data: Uint8Array,
): GenericInstruction<T, U> {
  let instruction = {
    programAddress,
    accounts,
    data,
  };
  return instruction;
}

/**
 *  SwigInstruction
 */
export type SwigInstruction<T extends IAccountMeta[] = IAccountMeta[]> =
  GenericInstruction<Address<'swigDk8JezhiAVde8k6NMwxpZfgGm2NNuMe1KYCmUjP'>, T>;

/**
 *  Generic Instruction
 */
export type GenericInstruction<
  T extends string = string,
  U extends IAccountMeta[] = IAccountMeta[],
> = IInstruction<T> &
  IInstructionWithData<Uint8Array> &
  IInstructionWithAccounts<U>;

// export function uint8ArraysEqual(a: Uint8Array, b: Uint8Array): boolean {
//   if (a.length !== b.length) return false;
//   return a.every((value, index) => value === b[index]);
// }
