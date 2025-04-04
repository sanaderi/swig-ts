import {
  SystemProgram,
  type AccountMeta,
  type PublicKey,
} from '@solana/web3.js';

export type AddAuthorityV1InstructionAccounts = {
  swig: PublicKey;
  payer: PublicKey;
};

export type AddAuthorityV1BaseAccountMetas = [
  AccountMeta,
  AccountMeta,
  AccountMeta,
];

export function getAddAuthorityV1BaseAccountMetas(
  accounts: AddAuthorityV1InstructionAccounts,
): AddAuthorityV1BaseAccountMetas {
  return [
    {
      pubkey: accounts.swig,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: accounts.payer,
      isSigner: true,
      isWritable: true,
    },
    {
      pubkey: SystemProgram.programId,
      isSigner: false,
      isWritable: false,
    },
  ];
}

export type AddAuthorityV1BaseAccountMetasWithAuthority = [
  ...AddAuthorityV1BaseAccountMetas,
  AccountMeta,
];

export function getAddV1BaseAccountMetasWithAuthority(
  accounts: AddAuthorityV1InstructionAccounts,
  authority: PublicKey,
): [AddAuthorityV1BaseAccountMetasWithAuthority, number] {
  let accountMetas = getAddAuthorityV1BaseAccountMetas(accounts);
  let authorityIndex = accountMetas.length;

  let metas: AddAuthorityV1BaseAccountMetasWithAuthority = [
    ...accountMetas,
    {
      pubkey: authority,
      isSigner: true,
      isWritable: false,
    },
  ];
  return [metas, authorityIndex];
}
