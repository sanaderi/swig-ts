import { getArrayEncoder, getU8Encoder } from '@solana/kit';
import {
  getAddAuthorityV1AuthorityPayloadEncoder,
  getCompactInstructionEncoder,
  getCreateSessionV1AuthorityPayloadCodec,
  getRemoveAuthorityV1AuthorityPayloadEncoder,
} from '@swig/coder';
import { keccak256 } from 'ethers';
import {
  SwigInstructionV1,
  compactInstructions,
  getAddAuthorityV1BaseAccountMetas,
  getRemoveAuthorityV1BaseAccountMetas,
  getSignV1BaseAccountMetas,
} from '../../instructions';
import { getCreateSessionV1BaseAccountMetasWithSystemProgram } from '../../instructions/createSessionV1';
import type { AuthorityInstruction, InstructionDataOptions } from './interface';

/**
 * Secp256k1 Authority
 */
export const Secp256k1Instruction: AuthorityInstruction = {
  /**
   *
   * @param accounts AddAuthorityV1InstructionAccountsWithAuthority
   * @param data AddAuthorityV1InstructionDataArgs
   * @returns TransactionInstruction
   *
   * Creates a `AddAuthorityV1` instruction
   */
  async addAuthorityV1Instruction(accounts, data, options) {
    if (!options)
      throw new Error(
        'instruction data options not provided for Secp256k1 based authority',
      );

    let addAuthorityIxAccountMetas =
      getAddAuthorityV1BaseAccountMetas(accounts);

    let authorityPayloadCodec = getAddAuthorityV1AuthorityPayloadEncoder();

    let message = authorityPayloadCodec.encode(data);

    let authorityPayload = await prepareSecpPayload(
      Uint8Array.from(message),
      options,
    );

    return SwigInstructionV1.addAuthority(addAuthorityIxAccountMetas, {
      ...data,
      authorityPayload,
    });
  },

  /**
   *
   * @param accounts removeAuthorityV1InstructionAccountsWithAuthority
   * @param data removeAuthorityV1InstructionDataArgs
   * @returns TransactionInstruction
   *
   * Creates a `RemoveAuthorityV1` instruction
   */
  async removeAuthorityV1Instruction(accounts, data, options) {
    if (!options)
      throw new Error(
        'instruction data options not provided for Secp256k1 based authority',
      );

    let removeIxAccountMetas = getRemoveAuthorityV1BaseAccountMetas(accounts);

    let authorityPayloadCodec = getRemoveAuthorityV1AuthorityPayloadEncoder(
      SECP_AUTHORITY_PAYLOAD_SIZE,
    );

    let message = authorityPayloadCodec.encode(data);

    let authorityPayload = await prepareSecpPayload(
      Uint8Array.from(message),
      options,
    );

    return SwigInstructionV1.removeAuthority(removeIxAccountMetas, {
      ...data,
      authorityPayload,
    });
  },

  /**
   *
   * @param accounts SignAuthorityV1InstructionAccountsWithAuthority
   * @param data SignAuthorityV1InstructionDataArgs
   * @returns TransactionInstruction
   *
   * Creates a `SignV1` instruction
   */
  async signV1Instruction(accounts, data, options) {
    if (!options)
      throw new Error(
        'instruction data options not provided for Secp256k1 based authority',
      );

    let signInstructionsAccount = getSignV1BaseAccountMetas(accounts);

    let { accounts: metas, compactIxs } = compactInstructions(
      accounts.swig,
      signInstructionsAccount,
      data.innerInstructions,
    );

    let encodedCompactInstructions = getArrayEncoder(
      getCompactInstructionEncoder(),
      {
        size: getU8Encoder(),
      },
    ).encode(compactIxs);

    let authorityPayload = await prepareSecpPayload(
      Uint8Array.from(encodedCompactInstructions),
      options,
    );

    return SwigInstructionV1.sign(metas, {
      roleId: data.roleId,
      authorityPayload,
      compactInstructions: compactIxs,
    });
  },

  async createSessionV1Instruction(accounts, data, options) {
    if (!options)
      throw new Error(
        'instruction data options not provided for Secp256k1 based authority',
      );

    let createSessionIxAccountMetas =
      getCreateSessionV1BaseAccountMetasWithSystemProgram(accounts);

    let authorityPayloadCodec =
      getCreateSessionV1AuthorityPayloadCodec(1).codec;

    let message = authorityPayloadCodec.encode(data);

    let authorityPayload = await prepareSecpPayload(
      Uint8Array.from(message),
      options,
    );

    return SwigInstructionV1.createSession(createSessionIxAccountMetas, {
      ...data,
      payloadSize: 1,
      authorityPayload,
    });
  },
};

export async function prepareSecpPayload(
  dataPayload: Uint8Array,
  options: InstructionDataOptions,
): Promise<Uint8Array> {
  let u64Len = 8;

  let slot = new Uint8Array(u64Len);

  let view = new DataView(slot.buffer);
  view.setBigUint64(0, options.currentSlot, true);

  const message = new Uint8Array(dataPayload.length + u64Len);
  message.set(dataPayload);
  message.set(slot, dataPayload.length);

  const hashHex = keccak256(message);

  let hash = Uint8Array.from(Buffer.from(hashHex.slice(2), 'hex'));

  let sig = await options.signingFn(hash);

  const authorityPayload = new Uint8Array(sig.length + u64Len);

  authorityPayload.set(slot);
  authorityPayload.set(sig, slot.length);

  return authorityPayload;
}

const SECP_AUTHORITY_PAYLOAD_SIZE = 65;
