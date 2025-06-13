import { AccountRole, Address } from '@solana/kit';

export type SignV1InstructionAccounts = {
  swig: Address;
  payer: Address;
};

export type SignV1BaseAccountMetas = [
  { address: Address; role: AccountRole },
  { address: Address; role: AccountRole },
];

export function getSignV1BaseAccountMetas(
  accounts: SignV1InstructionAccounts,
): SignV1BaseAccountMetas {
  return [
    {
      address: accounts.swig,
      role: AccountRole.WRITABLE, // isSigner: false, isWritable: true
    },
    {
      address: accounts.payer,
      role: AccountRole.WRITABLE_SIGNER, // isSigner: true, isWritable: true
    },
  ];
}

export type SignV1BaseAccountMetasWithAuthority = [
  ...SignV1BaseAccountMetas,
  { address: Address; role: AccountRole },
];

export function getSignV1BaseAccountMetasWithAuthority(
  accounts: SignV1InstructionAccounts,
  authority: Address,
): [SignV1BaseAccountMetasWithAuthority, number] {
  const accountMetas = getSignV1BaseAccountMetas(accounts);
  const authorityIndex = accountMetas.length;

  const metas: SignV1BaseAccountMetasWithAuthority = [
    ...accountMetas,
    {
      address: authority,
      role: AccountRole.READONLY_SIGNER, // isSigner: true, isWritable: false
    },
  ];
  return [metas, authorityIndex];
}
