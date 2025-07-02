// import { type AccountMeta, type PublicKey } from '@solana/web3.js';

import {
  AccountRole,
  type Address,
  type ReadonlyAccount,
  type ReadonlySignerAccount,
  type WritableAccount,
} from '@solana/kit';

export type SubAccountWithdrawV1BaseInstructionAccounts = {
  swig: Address;
  payer: Address;
  subAccount: Address;
};

export type SubAccountWithdrawV1SolInstructionAccounts =
  SubAccountWithdrawV1BaseInstructionAccounts;

export type SubAccountWithdrawV1TokenInstructionAccounts =
  SubAccountWithdrawV1BaseInstructionAccounts & {
    subAccountToken: Address;
    swigToken: Address;
    tokenProgram: Address;
  };

export type SubAccountWithdrawV1BaseAccountMetas = [
  ReadonlyAccount,
  ReadonlySignerAccount,
  WritableAccount,
];

export type SubAccountWithdrawV1SolAccountMetas =
  SubAccountWithdrawV1BaseAccountMetas;

export type SubAccountWithdrawV1TokenAccountMetas = [
  ...SubAccountWithdrawV1BaseAccountMetas,
  WritableAccount,
  WritableAccount,
  ReadonlyAccount,
];

export function getSubAccountWithdrawV1SolAccountMetas(
  accounts: SubAccountWithdrawV1SolInstructionAccounts,
): SubAccountWithdrawV1SolAccountMetas {
  return [
    {
      address: accounts.swig,
      role: AccountRole.READONLY,
      // isSigner: false,
      // isWritable: false,
    },
    {
      address: accounts.payer,
      role: AccountRole.READONLY_SIGNER,
      // isSigner: true,
      // isWritable: false,
    },
    {
      address: accounts.subAccount,
      role: AccountRole.WRITABLE,
      // isSigner: false,
      // isWritable: true,
    },
  ];
}

export function getSubAccountWithdrawV1TokenAccountMetas(
  accounts: SubAccountWithdrawV1TokenInstructionAccounts,
): SubAccountWithdrawV1TokenAccountMetas {
  return [
    {
      address: accounts.swig,
      role: AccountRole.READONLY,
      // isSigner: false,
      // isWritable: false,
    },
    {
      address: accounts.payer,
      role: AccountRole.READONLY_SIGNER,
      // isSigner: true,
      // isWritable: false,
    },
    {
      address: accounts.subAccount,
      role: AccountRole.WRITABLE,
      // isSigner: false,
      // isWritable: true,
    },
    {
      address: accounts.subAccountToken,
      role: AccountRole.WRITABLE,
      // isSigner: false,
      // isWritable: true,
    },
    {
      address: accounts.swigToken,
      role: AccountRole.WRITABLE,
      // isSigner: false,
      // isWritable: true,
    },
    {
      address: accounts.tokenProgram,
      role: AccountRole.READONLY,
      // isSigner: false,
      // isWritable: false,
    },
  ];
}

export type SubAccountWithdrawV1SolAccountMetasWithAuthority = [
  ...SubAccountWithdrawV1SolAccountMetas,
  ReadonlySignerAccount,
];

export function getSubAccountWithdrawV1SolAccountMetasWithAuthority(
  accounts: SubAccountWithdrawV1SolInstructionAccounts,
  authority: Address,
): [SubAccountWithdrawV1SolAccountMetasWithAuthority, number] {
  const accountMetas = getSubAccountWithdrawV1SolAccountMetas(accounts);
  const authorityIndex = accountMetas.length;

  const metas: SubAccountWithdrawV1SolAccountMetasWithAuthority = [
    ...accountMetas,
    {
      address: authority,
      role: AccountRole.READONLY_SIGNER
      // isSigner: true,
      // isWritable: false,
    },
  ];
  return [metas, authorityIndex];
}

export type SubAccountWithdrawV1TokenAccountMetasWithAuthority = [
  SubAccountWithdrawV1TokenAccountMetas[0],
  SubAccountWithdrawV1TokenAccountMetas[1],
  SubAccountWithdrawV1TokenAccountMetas[2],
  ReadonlySignerAccount,
  SubAccountWithdrawV1TokenAccountMetas[3],
  SubAccountWithdrawV1TokenAccountMetas[4],
  SubAccountWithdrawV1TokenAccountMetas[5],
];

export function getSubAccountWithdrawV1TokenAccountMetasWithAuthority(
  accounts: SubAccountWithdrawV1TokenInstructionAccounts,
  authority: Address,
): [SubAccountWithdrawV1TokenAccountMetasWithAuthority, number] {
  const accountMetas = getSubAccountWithdrawV1TokenAccountMetas(accounts);
  const authorityIndex = accountMetas.length;

  const metas: SubAccountWithdrawV1TokenAccountMetasWithAuthority = [
    accountMetas[0], // swig
    accountMetas[1], // payer
    accountMetas[2], // sub-account
    {
      address: authority,
      role: AccountRole.READONLY_SIGNER
      // isSigner: true,
      // isWritable: false,
    },
    accountMetas[3], // swig sub-account token
    accountMetas[4], // swig token
    accountMetas[5], // token program
  ];
  return [metas, authorityIndex];
}
