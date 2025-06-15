import type { Address } from '@solana/kit';
import { AccountRole } from '@solana/kit';
import { SYSTEM_PROGRAM_ADDRESS } from '../consts';

export type CreateSessionV1InstructionAccounts = {
  swig: Address;
  payer: Address;
};

export type CreateSessionV1BaseAccountMetas = [
  { address: Address; role: AccountRole },
  { address: Address; role: AccountRole },
];

export function getCreateSessionV1BaseAccountMetas(
  accounts: CreateSessionV1InstructionAccounts,
): CreateSessionV1BaseAccountMetas {
  return [
    {
      address: accounts.swig,
      role: AccountRole.WRITABLE,
    },
    {
      address: accounts.payer,
      role: AccountRole.WRITABLE_SIGNER,
    },
  ];
}

export type CreateSessionV1BaseAccountMetasWithAuthority = [
  ...CreateSessionV1BaseAccountMetas,
  { address: Address; role: AccountRole },
];

export function getCreateSessionV1BaseAccountMetasWithAuthority(
  accounts: CreateSessionV1InstructionAccounts,
  authority: Address,
): [CreateSessionV1BaseAccountMetasWithAuthority, number] {
  const accountMetas = getCreateSessionV1BaseAccountMetas(accounts);
  const authorityIndex = accountMetas.length;

  const metas: CreateSessionV1BaseAccountMetasWithAuthority = [
    ...accountMetas,
    {
      address: authority,
      role: AccountRole.READONLY_SIGNER,
    },
  ];
  return [metas, authorityIndex];
}

export type CreateSessionV1BaseAccountMetasWithSystemProgram = [
  ...CreateSessionV1BaseAccountMetas,
  { address: Address; role: AccountRole },
];

export function getCreateSessionV1BaseAccountMetasWithSystemProgram(
  accounts: CreateSessionV1InstructionAccounts,
): CreateSessionV1BaseAccountMetasWithSystemProgram {
  const accountMetas = getCreateSessionV1BaseAccountMetas(accounts);

  return [
    ...accountMetas,
    {
      address: SYSTEM_PROGRAM_ADDRESS,
      role: AccountRole.READONLY,
    },
  ];
}
