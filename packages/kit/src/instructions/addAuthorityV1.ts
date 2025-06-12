import { AccountRole, Address, IAccountMeta } from '@solana/kit';

export type AddAuthorityV1InstructionAccounts = {
  swig: Address;
  payer: Address;
};

export type AddAuthorityV1BaseAccountMetas = [
  IAccountMeta,
  IAccountMeta,
  IAccountMeta,
];

export function getAddAuthorityV1BaseAccountMetas(
  accounts: AddAuthorityV1InstructionAccounts,
): AddAuthorityV1BaseAccountMetas {
  return [
    {
      address: accounts.swig,
      role: AccountRole.WRITABLE, // isSigner: false, isWritable: true
    },
    {
      address: accounts.payer,
      role: AccountRole.WRITABLE_SIGNER, // isSigner: true, isWritable: true
    },
    {
      address: '11111111111111111111111111111111' as Address,
      role: AccountRole.READONLY, // isSigner: false, isWritable: false
    },
  ];
}

export type AddAuthorityV1BaseAccountMetasWithAuthority = [
  ...AddAuthorityV1BaseAccountMetas,
  IAccountMeta,
];

export function getAddV1BaseAccountMetasWithAuthority(
  accounts: AddAuthorityV1InstructionAccounts,
  authority: Address,
): [AddAuthorityV1BaseAccountMetasWithAuthority, number] {
  const accountMetas = getAddAuthorityV1BaseAccountMetas(accounts);
  const authorityIndex = accountMetas.length;

  const metas: AddAuthorityV1BaseAccountMetasWithAuthority = [
    ...accountMetas,
    {
      address: authority,
      role: AccountRole.READONLY_SIGNER, // isSigner: true, isWritable: false
    },
  ];
  return [metas, authorityIndex];
}
