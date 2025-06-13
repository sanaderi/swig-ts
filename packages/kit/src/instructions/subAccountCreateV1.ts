import { AccountRole, Address } from '@solana/kit';
import { SYSTEM_PROGRAM_ADDRESS } from '../consts';

export type SubAccountCreateV1InstructionAccounts = {
  swig: Address;
  payer: Address;
  subAccount: Address;
};

export type SubAccountCreateV1BaseAccountMetas = [
  { address: Address; role: AccountRole },
  { address: Address; role: AccountRole },
  { address: Address; role: AccountRole },
  { address: Address; role: AccountRole },
];

export function getSubAccountCreateV1BaseAccountMetas(
  accounts: SubAccountCreateV1InstructionAccounts,
): SubAccountCreateV1BaseAccountMetas {
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
      address: accounts.subAccount,
      role: AccountRole.WRITABLE,
    },
    {
      address: SYSTEM_PROGRAM_ADDRESS,
      role: AccountRole.READONLY,
    },
  ];
}

export type SubAccountCreateV1BaseAccountMetasWithAuthority = [
  ...SubAccountCreateV1BaseAccountMetas,
  { address: Address; role: AccountRole },
];

export function getSubAccountCreateV1BaseAccountMetasWithAuthority(
  accounts: SubAccountCreateV1InstructionAccounts,
  authority: Address,
): [SubAccountCreateV1BaseAccountMetasWithAuthority, number] {
  const accountMetas = getSubAccountCreateV1BaseAccountMetas(accounts);
  const authorityIndex = accountMetas.length;

  const metas: SubAccountCreateV1BaseAccountMetasWithAuthority = [
    ...accountMetas,
    {
      address: authority,
      role: AccountRole.READONLY_SIGNER,
    },
  ];
  return [metas, authorityIndex];
}

export type SubAccountCreateV1BaseAccountMetasWithSystemProgram = [
  ...SubAccountCreateV1BaseAccountMetas,
  { address: Address; role: AccountRole },
];

export function getSubAccountCreateV1BaseAccountMetasWithSystemProgram(
  accounts: SubAccountCreateV1InstructionAccounts,
): SubAccountCreateV1BaseAccountMetasWithSystemProgram {
  const accountMetas = getSubAccountCreateV1BaseAccountMetas(accounts);

  return [
    ...accountMetas,
    {
      address: SYSTEM_PROGRAM_ADDRESS,
      role: AccountRole.READONLY,
    },
  ];
}
