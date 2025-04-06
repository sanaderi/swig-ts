import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import {
  SwigInstructionV1,
  compactInstructions,
  getAddV1BaseAccountMetasWithAuthority,
  getRemoveV1BaseAccountMetasWithAuthority,
  getReplaceV1BaseAccountMetasWithAuthority,
  getSignV1BaseAccountMetasWithAuthority,
} from '../../instructions';
import { getCreateSessionV1BaseAccountMetasWithAuthority } from '../../instructions/createSessionV1';
import type { AuthorityInstruction } from '../interface';

/**
 * Ed25519 Authority
 */
export const Ed25519Instruction: AuthorityInstruction = {
  /**
   *
   * @param accounts AddAuthorityV1InstructionAccountsWithAuthority
   * @param data AddAuthorityV1InstructionDataArgs
   * @returns SwigInstruction
   *
   * Creates a `AddAuthorityV1` instruction
   */
  addAuthorityV1Instruction(accounts, data): TransactionInstruction {
    let authority = new PublicKey(data.authorityData);

    let [addAuthorityIxAccountMetas, authorityPayload] =
      getAddV1BaseAccountMetasWithAuthority(accounts, authority);

    return SwigInstructionV1.addAuthority(addAuthorityIxAccountMetas, {
      ...data,
      authorityPayload: new Uint8Array([authorityPayload]),
    });
  },

  /**
   *
   * @param accounts removeAuthorityV1InstructionAccountsWithAuthority
   * @param data removeAuthorityV1InstructionDataArgs
   * @returns SwigInstruction
   *
   * Creates a `RemoveAuthorityV1` instruction
   */
  removeAuthorityV1Instruction(accounts, data): TransactionInstruction {
    let authority = new PublicKey(data.authorityData);

    let [removeIxAccountMetas, authorityPayload] =
      getRemoveV1BaseAccountMetasWithAuthority(accounts, authority);

    return SwigInstructionV1.removeAuthority(removeIxAccountMetas, {
      ...data,
      authorityPayload: Uint8Array.from([authorityPayload]),
    });
  },

  /**
   *
   * @param accounts ReplaceAuthorityV1InstructionAccountsWithAuthority
   * @param data replaceAuthorityV1InstructionDataArgs
   * @returns SwigInstruction
   *
   * Creates a `ReplaceAuthorityV1` instruction
   */
  replaceAuthorityV1Instruction(accounts, data): TransactionInstruction {
    let authority = new PublicKey(data.authorityData);

    let [replaceIxAccountMetas, authorityPayload] =
      getReplaceV1BaseAccountMetasWithAuthority(accounts, authority);

    return SwigInstructionV1.replaceAuthority(replaceIxAccountMetas, {
      ...data,
      authorityPayload: Uint8Array.from([authorityPayload]),
    });
  },

  /**
   *
   * @param accounts SignAuthorityV1InstructionAccountsWithAuthority
   * @param data SignAuthorityV1InstructionDataArgs
   * @returns SwigInstruction
   *
   * Creates a `SignV1` instruction
   */
  signV1Instruction(accounts, data): TransactionInstruction {
    let authority = new PublicKey(data.authorityData);

    let [signInstructionsAccount, authorityPayload] =
      getSignV1BaseAccountMetasWithAuthority(accounts, authority);

    let { accounts: metas, compactIxs } = compactInstructions(
      accounts.swig,
      signInstructionsAccount,
      data.innerInstructions,
    );

    return SwigInstructionV1.sign(metas, {
      roleId: data.roleId,
      authorityPayload: new Uint8Array([authorityPayload]),
      compactInstructions: compactIxs,
    });
  },

  createSessionV1Instruction(accounts, data) {
    let authority = new PublicKey(data.authorityData);

    let [createSessionAccount, authorityPayload] =
      getCreateSessionV1BaseAccountMetasWithAuthority(accounts, authority);

    return SwigInstructionV1.createSession(createSessionAccount, {
      ...data,
      authorityPayload: Uint8Array.from([authorityPayload]),
    });
  },
};
