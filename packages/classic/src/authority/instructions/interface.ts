import type { ReadonlyUint8Array } from '@solana/kit';
import type { TransactionInstruction } from '@solana/web3.js';
import type {
  AddAuthorityV1InstructionDataArgs,
  CreateSessionV1InstructionDataArgs,
  RemoveAuthorityV1InstructionDataArgs,
} from '@swig-wallet/coder';
import {
  type AddAuthorityV1InstructionAccounts,
  type RemoveAuthorityV1InstructionAccounts,
  type SignV1InstructionAccounts,
} from '../../instructions';

/**
 * Authority Instruction Interface
 */
export interface AuthorityInstruction {
  addAuthorityV1Instruction(
    accounts: AddAuthorityV1InstructionAccounts,
    data: Omit<AddAuthorityV1InstructionDataArgs, 'authorityPayload'> & {
      authorityData: ReadonlyUint8Array;
    },
    options?: InstructionDataOptions,
  ): Promise<TransactionInstruction>;

  removeAuthorityV1Instruction(
    accounts: RemoveAuthorityV1InstructionAccounts,
    data: Omit<RemoveAuthorityV1InstructionDataArgs, 'authorityPayload'> & {
      authorityData: ReadonlyUint8Array;
    },
    options?: InstructionDataOptions,
  ): Promise<TransactionInstruction>;

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

/**
 * Signing interface that takes a message and returns a signature of the signed message
 */
export type SigningFn = (message: Uint8Array) => Promise<SigningResult>;

/**
 * @property signature - Signature of the message
 * @property prefix - Additional Prefix added to the message
 */
export type SigningResult = { signature: Uint8Array; prefix?: Uint8Array };

/**
 * Options used for constructing or signing instruction data.
 *
 * @property signingFn - {@link SigningFn}.
 * @property currentSlot - current slot.
 */
export type InstructionDataOptions = {
  signingFn: SigningFn;
  currentSlot: bigint;
};
