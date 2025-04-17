import type { ReadonlyUint8Array } from '@solana/kit';
import type { TransactionInstruction } from '@solana/web3.js';
import type {
  AddAuthorityV1InstructionDataArgs,
  CreateSessionV1InstructionDataArgs,
  RemoveAuthorityV1InstructionDataArgs,
} from '@swig/coder';
import {
  type AddAuthorityV1InstructionAccounts,
  type RemoveAuthorityV1InstructionAccounts,
  type SignV1InstructionAccounts,
} from '../../instructions';

/**
 * Authority Instruction Interface
 */
export interface AuthorityInstruction {
  /**
   *
   * @param accounts AddAuthorityV1InstructionAccountsWithAuthority
   * @param data AddAuthorityV1InstructionDataArgs
   * @returns SwigInstruction
   *
   * Creates a `AddAuthorityV1` instruction
   */
  addAuthorityV1Instruction(
    accounts: AddAuthorityV1InstructionAccounts,
    data: Omit<AddAuthorityV1InstructionDataArgs, 'authorityPayload'> & {
      authorityData: ReadonlyUint8Array;
    },
    options?: InstructionDataOptions,
  ): Promise<TransactionInstruction>;

  /**
   *
   * @param accounts removeAuthorityV1InstructionAccountsWithAuthority
   * @param data removeAuthorityV1InstructionDataArgs
   * @returns SwigInstruction
   *
   * Creates a `RemoveAuthorityV1` instruction
   */
  removeAuthorityV1Instruction(
    accounts: RemoveAuthorityV1InstructionAccounts,
    data: Omit<RemoveAuthorityV1InstructionDataArgs, 'authorityPayload'> & {
      authorityData: ReadonlyUint8Array;
    },
    options?: InstructionDataOptions,
  ): Promise<TransactionInstruction>;

  /**
   *
   * @param accounts SignAuthorityV1InstructionAccountsWithAuthority
   * @param data SignAuthorityV1InstructionDataArgs
   * @returns SwigInstruction
   *
   * Creates a `SignV1` instruction
   */
  signV1Instruction(
    accounts: SignV1InstructionAccounts,
    data: {
      authorityData: ReadonlyUint8Array;
      roleId: number;
      innerInstructions: TransactionInstruction[];
    },
    options?: InstructionDataOptions,
  ): Promise<TransactionInstruction>;

  createSessionV1Instruction(
    accounts: SignV1InstructionAccounts,
    data: Omit<CreateSessionV1InstructionDataArgs, 'authorityPayload'> & {
      authorityData: ReadonlyUint8Array;
    },
    options?: InstructionDataOptions,
  ): Promise<TransactionInstruction>;
}

export type SigningFn = (message: Uint8Array) => Promise<Uint8Array>;

export type InstructionDataOptions = {
  signingFn: SigningFn;
  currentSlot: bigint;
};
