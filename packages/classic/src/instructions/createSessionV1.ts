import { type AccountMeta, type PublicKey } from '@solana/web3.js';

export type CreateSessionV1InstructionAccounts = {
  swig: PublicKey;
  payer: PublicKey;
};

export type CreateSessionV1BaseAccountMetas = [AccountMeta, AccountMeta];

export function getCreateSessionV1BaseAccountMetas(
  accounts: CreateSessionV1InstructionAccounts,
): CreateSessionV1BaseAccountMetas {
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
  ];
}

export type CreateSessionV1BaseAccountMetasWithAuthority = [
  ...CreateSessionV1BaseAccountMetas,
  AccountMeta,
];

export function getCreateSessionV1BaseAccountMetasWithAuthority(
  accounts: CreateSessionV1InstructionAccounts,
  authority: PublicKey,
): [CreateSessionV1BaseAccountMetasWithAuthority, number] {
  let accountMetas = getCreateSessionV1BaseAccountMetas(accounts);
  let authorityIndex = accountMetas.length;

  let metas: CreateSessionV1BaseAccountMetasWithAuthority = [
    ...accountMetas,
    {
      pubkey: authority,
      isSigner: true,
      isWritable: false,
    },
  ];
  return [metas, authorityIndex];
}
