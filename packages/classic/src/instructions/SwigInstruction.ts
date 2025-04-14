import type { AccountMeta, TransactionInstruction } from '@solana/web3.js';
import {
  getAddAuthorityV1InstructionCodec,
  getCreateSessionV1InstructionCodec,
  getCreateV1InstructionDataCodec,
  getRemoveAuthorityV1InstructionCodec,
  getSignV1InstructionCodec,
  type AddAuthorityV1InstructionDataArgs,
  type CreateSessionV1InstructionDataArgs,
  type CreateV1InstructionDataArgs,
  type RemoveAuthorityV1InstructionDataArgs,
  type SignV1InstructionDataArgs,
} from '@swig/coder';
import { swigInstruction } from '../utils';
import { type AddAuthorityV1BaseAccountMetas } from './addAuthorityV1';
import {
  getCreateV1BaseAccountMetas,
  type CreateV1BaseAccountMetas,
  type CreateV1InstructionAccounts,
} from './createV1';
import { type RemoveAuthorityV1BaseAccountMetas } from './removeAuthorityV1';
import { type SignV1BaseAccountMetas } from './signV1';
import type { CreateSessionV1BaseAccountMetas } from './createSessionV1';

/**
 *
 * @param accounts `CreateV1InstructionAccounts`
 * @param data `CreateV1InstructionDataArgs`
 * @returns `SwigInstruction`
 */
export function createSwigInstruction(
  accounts: CreateV1InstructionAccounts,
  data: CreateV1InstructionDataArgs,
): TransactionInstruction {
  let createIxAccountMetas = getCreateV1BaseAccountMetas(accounts);
  return SwigInstructionV1.create(createIxAccountMetas, data);
}

/**
 * Ed25519 Authority
 */
export class SwigInstructionV1 {
  /**
   *
   * @param accounts CreateV1InstructionAccounts
   * @param data CreateV1InstructionDataArgs
   * @returns SwigInstruction
   *
   * Creates a `CreateV1` instruction
   */
  static create<T extends CreateV1BaseAccountMetas = CreateV1BaseAccountMetas>(
    accounts: T,
    data: CreateV1InstructionDataArgs,
  ): TransactionInstruction {
    let createV1InstructionDataEncoder =
      getCreateV1InstructionDataCodec().encoder;

    let createV1InstructionData = createV1InstructionDataEncoder.encode(data);

    return swigInstruction(accounts, new Uint8Array(createV1InstructionData));
  }

  /**
   *
   * @param accounts AddAuthorityV1InstructionAccountsWithAuthority
   * @param data AddAuthorityV1InstructionDataArgs
   * @returns SwigInstruction
   *
   * Creates a `AddAuthorityV1` instruction
   */
  static addAuthority<
    T extends [...AddAuthorityV1BaseAccountMetas, ...AccountMeta[]],
  >(
    accounts: T,
    data: AddAuthorityV1InstructionDataArgs,
  ): TransactionInstruction {
    let addV1InstructionDataEncoder = getAddAuthorityV1InstructionCodec(
      data.authorityPayload.length,
      data.newAuthorityData.length,
    ).encoder;

    let addAuthorityV1InstructionData =
      addV1InstructionDataEncoder.encode(data);

    return swigInstruction(
      accounts,
      new Uint8Array(addAuthorityV1InstructionData),
    );
  }

  /**
   *
   * @param accounts removeAuthorityV1InstructionAccountsWithAuthority
   * @param data removeAuthorityV1InstructionDataArgs
   * @returns SwigInstruction
   *
   * Creates a `RemoveAuthorityV1` instruction
   */
  static removeAuthority<
    T extends [...RemoveAuthorityV1BaseAccountMetas, ...AccountMeta[]],
  >(
    accounts: T,
    data: RemoveAuthorityV1InstructionDataArgs,
  ): TransactionInstruction {
    let removeV1InstructionDataEncoder = getRemoveAuthorityV1InstructionCodec(
      data.authorityPayload.length,
    ).encoder;

    let removeAuthorityV1InstructionData =
      removeV1InstructionDataEncoder.encode(data);

    return swigInstruction(
      accounts,
      new Uint8Array(removeAuthorityV1InstructionData),
    );
  }

  /**
   *
   * @param accounts SignAuthorityV1InstructionAccountsWithAuthority
   * @param data SignAuthorityV1InstructionDataArgs
   * @returns SwigInstruction
   *
   * Creates a `SignV1` instruction
   */
  static sign<T extends [...SignV1BaseAccountMetas, ...AccountMeta[]]>(
    accounts: T,
    data: SignV1InstructionDataArgs,
  ): TransactionInstruction {
    let signV1InstructionDataEncoder = getSignV1InstructionCodec(
      data.authorityPayload.length,
    ).encoder;

    let signV1InstructionData = signV1InstructionDataEncoder.encode(data);

    return swigInstruction(accounts, new Uint8Array(signV1InstructionData));
  }

  static createSession<
    T extends [...CreateSessionV1BaseAccountMetas, ...AccountMeta[]],
  >(
    accounts: T,
    data: CreateSessionV1InstructionDataArgs,
  ): TransactionInstruction {
    let createSessionV1InstructionDataEncoder = getCreateSessionV1InstructionCodec(
      data.authorityPayload.length,
    ).encoder;

    let createSessionV1InstructionData =
      createSessionV1InstructionDataEncoder.encode(data);

    return swigInstruction(
      accounts,
      new Uint8Array(createSessionV1InstructionData),
    );
  }
}
