import type { Address } from '@solana/kit';
import { AccountRole } from '@solana/kit';
import { SYSTEM_PROGRAM_ADDRESS } from '../consts';

export type RemoveAuthorityV1InstructionAccounts = {
  swig: Address;
  payer: Address;
};

export type RemoveAuthorityV1BaseAccountMetas = [
  { address: Address; role: AccountRole },
  { address: Address; role: AccountRole },
  { address: Address; role: AccountRole },
];

export function getRemoveAuthorityV1BaseAccountMetas(
  accounts: RemoveAuthorityV1InstructionAccounts,
): RemoveAuthorityV1BaseAccountMetas {
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

export type RemoveAuthorityV1BaseAccountMetasWithAuthority = [
  ...RemoveAuthorityV1BaseAccountMetas,
  { address: Address; role: AccountRole },
];

export function getRemoveV1BaseAccountMetasWithAuthority(
  accounts: RemoveAuthorityV1InstructionAccounts,
  authority: Address,
): [RemoveAuthorityV1BaseAccountMetasWithAuthority, number] {
  const accountMetas = getRemoveAuthorityV1BaseAccountMetas(accounts);
  const authorityIndex = accountMetas.length;

  const metas: RemoveAuthorityV1BaseAccountMetasWithAuthority = [
    ...accountMetas,
    {
      address: authority,
      role: AccountRole.READONLY_SIGNER,
    },
  ];
  return [metas, authorityIndex];
}
