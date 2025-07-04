import { AccountRole } from '@solana/kit';
import { SYSTEM_PROGRAM_ADDRESS } from '../consts';
import { SolAccountMeta, type SolanaPublicKey } from '../schema';

export type CreateSessionV1InstructionAccounts = {
  swig: SolanaPublicKey;
  payer: SolanaPublicKey;
};

export type CreateSessionV1BaseAccountMetas = [SolAccountMeta, SolAccountMeta];

export function getCreateSessionV1BaseAccountMetas(
  accounts: CreateSessionV1InstructionAccounts,
): CreateSessionV1BaseAccountMetas {
  return [
    SolAccountMeta.fromKitAccountMeta({
      address: accounts.swig.toAddress(),
      role: AccountRole.WRITABLE,
    }),
    SolAccountMeta.fromKitAccountMeta({
      address: accounts.payer.toAddress(),
      role: AccountRole.WRITABLE_SIGNER,
    }),
  ];
}

export type CreateSessionV1BaseAccountMetasWithAuthority = [
  ...CreateSessionV1BaseAccountMetas,
  SolAccountMeta,
];

export function getCreateSessionV1BaseAccountMetasWithAuthority(
  accounts: CreateSessionV1InstructionAccounts,
  authority: SolanaPublicKey,
): [CreateSessionV1BaseAccountMetasWithAuthority, number] {
  const accountMetas = getCreateSessionV1BaseAccountMetas(accounts);
  const authorityIndex = accountMetas.length;

  const metas: CreateSessionV1BaseAccountMetasWithAuthority = [
    ...accountMetas,
    SolAccountMeta.fromKitAccountMeta({
      address: authority.toAddress(),
      role: AccountRole.READONLY_SIGNER,
    }),
  ];
  return [metas, authorityIndex];
}

export type CreateSessionV1BaseAccountMetasWithSystemProgram = [
  ...CreateSessionV1BaseAccountMetas,
  SolAccountMeta,
];

export function getCreateSessionV1BaseAccountMetasWithSystemProgram(
  accounts: CreateSessionV1InstructionAccounts,
): CreateSessionV1BaseAccountMetasWithSystemProgram {
  const accountMetas = getCreateSessionV1BaseAccountMetas(accounts);

  return [
    ...accountMetas,
    SolAccountMeta.fromKitAccountMeta({
      address: SYSTEM_PROGRAM_ADDRESS,
      role: AccountRole.READONLY,
    }),
  ];
}
