import {
  SystemProgram,
  type AccountMeta,
  type PublicKey,
} from '@solana/web3.js';

export type RemoveAuthorityV1InstructionAccounts = {
  swig: PublicKey;
  payer: PublicKey;
};

export type RemoveAuthorityV1BaseAccountMetas = [
  AccountMeta,
  AccountMeta,
  AccountMeta,
];

export function getRemoveAuthorityV1BaseAccountMetas(
  accounts: RemoveAuthorityV1InstructionAccounts,
): RemoveAuthorityV1BaseAccountMetas {
  return [
    {
      pubkey: accounts.swig,
      // role: AccountRole.WRITABLE,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: accounts.payer,
      // role: AccountRole.WRITABLE_SIGNER,
      isSigner: true,
      isWritable: true,
    },
    {
      pubkey: SystemProgram.programId,
      // role: AccountRole.READONLY,
      isSigner: false,
      isWritable: false,
    },
  ];
}

export type RemoveAuthorityV1BaseAccountMetasWithAuthority = [
  ...RemoveAuthorityV1BaseAccountMetas,
  AccountMeta,
];

export function getRemoveV1BaseAccountMetasWithAuthority(
  accounts: RemoveAuthorityV1InstructionAccounts,
  authority: PublicKey,
): [RemoveAuthorityV1BaseAccountMetasWithAuthority, number] {
  let accountMetas = getRemoveAuthorityV1BaseAccountMetas(accounts);
  let authorityIndex = accountMetas.length;

  let metas: RemoveAuthorityV1BaseAccountMetasWithAuthority = [
    ...accountMetas,
    {
      pubkey: authority,
      // role: AccountRole.READONLY_SIGNER,
      isSigner: true,
      isWritable: false,
    },
  ];
  return [metas, authorityIndex];
}
