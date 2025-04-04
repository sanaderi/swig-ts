import type { AccountMeta, PublicKey } from '@solana/web3.js';

export type SignV1InstructionAccounts = {
  swig: PublicKey;
  payer: PublicKey;
};

export type SignV1BaseAccountMetas = [AccountMeta, AccountMeta];

export function getSignV1BaseAccountMetas(
  accounts: SignV1InstructionAccounts,
): SignV1BaseAccountMetas {
  return [
    {
      pubkey: accounts.swig,
      // role: AccountRole.WRITABLE,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: accounts.payer,
      // role: AccountRole.WRITABLE_SIGNER,
      isSigner: true,
      isWritable: true,
    },
  ];
}

export type SignV1BaseAccountMetasWithAuthority = [
  ...SignV1BaseAccountMetas,
  AccountMeta,
];

export function getSignV1BaseAccountMetasWithAuthority(
  accounts: SignV1InstructionAccounts,
  authority: PublicKey,
): [SignV1BaseAccountMetasWithAuthority, number] {
  let accountMetas = getSignV1BaseAccountMetas(accounts);
  let authorityIndex = accountMetas.length;

  let metas: SignV1BaseAccountMetasWithAuthority = [
    ...accountMetas,
    {
      pubkey: authority,
      // role: AccountRole.READONLY_SIGNER,
      isSigner: true,
      isWritable: false,
    },
  ];
  return [metas, authorityIndex];
}
