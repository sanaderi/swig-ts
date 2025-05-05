import { PublicKey } from '@solana/web3.js';
import {
  SwigInstructionV1,
  compactInstructions,
  getAddV1BaseAccountMetasWithAuthority,
  getRemoveV1BaseAccountMetasWithAuthority,
  getSignV1BaseAccountMetasWithAuthority,
} from '../../instructions';
import { getCreateSessionV1BaseAccountMetasWithAuthority } from '../../instructions/createSessionV1';
import type { AuthorityInstruction } from './interface';

/**
 * Ed25519 Authority Instructions
 */
export const Ed25519Instruction: AuthorityInstruction = {
  async addAuthorityV1Instruction(accounts, data) {
    let authority = new PublicKey(data.authorityData);

    let [addAuthorityIxAccountMetas, authorityPayload] =
      getAddV1BaseAccountMetasWithAuthority(accounts, authority);

    return SwigInstructionV1.addAuthority(addAuthorityIxAccountMetas, {
      ...data,
      authorityPayload: new Uint8Array([authorityPayload]),
    });
  },

  async removeAuthorityV1Instruction(accounts, data) {
    let authority = new PublicKey(data.authorityData);

    let [removeIxAccountMetas, authorityPayload] =
      getRemoveV1BaseAccountMetasWithAuthority(accounts, authority);

    return SwigInstructionV1.removeAuthority(removeIxAccountMetas, {
      ...data,
      authorityPayload: Uint8Array.from([authorityPayload]),
    });
  },

  async signV1Instruction(accounts, data) {
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

  async createSessionV1Instruction(accounts, data) {
    let authority = new PublicKey(data.authorityData);

    let [createSessionAccount, authorityPayload] =
      getCreateSessionV1BaseAccountMetasWithAuthority(accounts, authority);

    return SwigInstructionV1.createSession(createSessionAccount, {
      ...data,
      authorityPayload: Uint8Array.from([authorityPayload]),
    });
  },
};
