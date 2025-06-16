import { AccountRole, type Address, type IAccountMeta } from '@solana/kit';
import { SYSTEM_PROGRAM_ADDRESS } from '../consts';

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
      address: SYSTEM_PROGRAM_ADDRESS,
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
