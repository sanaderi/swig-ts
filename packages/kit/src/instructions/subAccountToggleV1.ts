import { AccountRole, type Address } from '@solana/kit';
import { SYSTEM_PROGRAM_ADDRESS } from '../consts';

export type SubAccountToggleV1InstructionAccounts = {
  swig: Address;
  payer: Address;
  subAccount: Address;
};

export type SubAccountToggleV1BaseAccountMetas = [
  { address: Address; role: AccountRole },
  { address: Address; role: AccountRole },
  { address: Address; role: AccountRole },
];

export function getSubAccountToggleV1BaseAccountMetas(
  accounts: SubAccountToggleV1InstructionAccounts,
): SubAccountToggleV1BaseAccountMetas {
  return [
    {
      address: accounts.swig,
      role: AccountRole.READONLY,
    },
    {
      address: accounts.payer,
      role: AccountRole.READONLY_SIGNER,
    },
    {
      address: accounts.subAccount,
      role: AccountRole.WRITABLE,
    },
  ];
}

export type SubAccountToggleV1BaseAccountMetasWithAuthority = [
  ...SubAccountToggleV1BaseAccountMetas,
  { address: Address; role: AccountRole },
];

export function getSubAccountToggleV1BaseAccountMetasWithAuthority(
  accounts: SubAccountToggleV1InstructionAccounts,
  authority: Address,
): [SubAccountToggleV1BaseAccountMetasWithAuthority, number] {
  const accountMetas = getSubAccountToggleV1BaseAccountMetas(accounts);
  const authorityIndex = accountMetas.length;

  const metas: SubAccountToggleV1BaseAccountMetasWithAuthority = [
    ...accountMetas,
    {
      address: authority,
      role: AccountRole.READONLY_SIGNER,
    },
  ];
  return [metas, authorityIndex];
}

export type SubAccountToggleV1BaseAccountMetasWithSystemProgram = [
  ...SubAccountToggleV1BaseAccountMetas,
  { address: Address; role: AccountRole },
];

export function getSubAccountToggleV1BaseAccountMetasWithSystemProgram(
  accounts: SubAccountToggleV1InstructionAccounts,
): SubAccountToggleV1BaseAccountMetasWithSystemProgram {
  const accountMetas = getSubAccountToggleV1BaseAccountMetas(accounts);

  return [
    ...accountMetas,
    {
      address: SYSTEM_PROGRAM_ADDRESS,
      role: AccountRole.READONLY,
    },
  ];
}
