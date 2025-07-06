import type {
  Address,
  IAccountMeta,
  IInstruction,
  IInstructionWithAccounts,
  IInstructionWithData,
  ReadonlyUint8Array,
} from '@solana/kit';

/**
 *  Generic Instruction
 */
export type GenericInstruction<
  T extends string = string,
  U extends IAccountMeta[] = IAccountMeta[],
  V extends ReadonlyUint8Array = ReadonlyUint8Array
> = IInstruction<T> &
  IInstructionWithData<V> &
  IInstructionWithAccounts<U>;

// export function uint8ArraysEqual(a: Uint8Array, b: Uint8Array): boolean {
//   if (a.length !== b.length) return false;
//   return a.every((value, index) => value === b[index]);
// }
