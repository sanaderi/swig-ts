import { AccountRole, Address } from '@solana/kit';
import { SYSTEM_PROGRAM_ADDRESS } from '../consts';

export type ReplaceAuthorityV1InstructionAccounts = {
  swig: Address;
  payer: Address;
};

export type ReplaceAuthorityV1BaseAccountMetas = [
  { address: Address; role: AccountRole },
  { address: Address; role: AccountRole },
  { address: Address; role: AccountRole },
];

export function getReplaceAuthorityV1BaseAccountMetas(
  accounts: ReplaceAuthorityV1InstructionAccounts,
): ReplaceAuthorityV1BaseAccountMetas {
  return [
    {
      address: accounts.swig,
      role: AccountRole.WRITABLE,
    },
    {
      address: accounts.payer,
      role: AccountRole.WRITABLE_SIGNER,
    },
    {
      address: SYSTEM_PROGRAM_ADDRESS,
      role: AccountRole.READONLY,
    },
  ];
}

export type ReplaceAuthorityV1BaseAccountMetasWithAuthority = [
  ...ReplaceAuthorityV1BaseAccountMetas,
  { address: Address; role: AccountRole },
];

export function getReplaceV1BaseAccountMetasWithAuthority(
  accounts: ReplaceAuthorityV1InstructionAccounts,
  authority: Address,
): [ReplaceAuthorityV1BaseAccountMetasWithAuthority, number] {
  const accountMetas = getReplaceAuthorityV1BaseAccountMetas(accounts);
  const authorityIndex = accountMetas.length;

  const metas: ReplaceAuthorityV1BaseAccountMetasWithAuthority = [
    ...accountMetas,
    {
      address: authority,
      role: AccountRole.READONLY_SIGNER,
    },
  ];
  return [metas, authorityIndex];
}
