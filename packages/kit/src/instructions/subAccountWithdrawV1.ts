import { AccountRole, Address } from '@solana/kit';

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
  { address: Address; role: AccountRole },
  { address: Address; role: AccountRole },
  { address: Address; role: AccountRole },
];

export type SubAccountWithdrawV1SolAccountMetas =
  SubAccountWithdrawV1BaseAccountMetas;

export type SubAccountWithdrawV1TokenAccountMetas = [
  ...SubAccountWithdrawV1BaseAccountMetas,
  { address: Address; role: AccountRole },
  { address: Address; role: AccountRole },
  { address: Address; role: AccountRole },
];

export function getSubAccountWithdrawV1SolAccountMetas(
  accounts: SubAccountWithdrawV1SolInstructionAccounts,
): SubAccountWithdrawV1SolAccountMetas {
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

export function getSubAccountWithdrawV1TokenAccountMetas(
  accounts: SubAccountWithdrawV1TokenInstructionAccounts,
): SubAccountWithdrawV1TokenAccountMetas {
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
    {
      address: accounts.subAccountToken,
      role: AccountRole.WRITABLE,
    },
    {
      address: accounts.swigToken,
      role: AccountRole.WRITABLE,
    },
    {
      address: accounts.tokenProgram,
      role: AccountRole.READONLY,
    },
  ];
}

export type SubAccountWithdrawV1SolAccountMetasWithAuthority = [
  ...SubAccountWithdrawV1SolAccountMetas,
  { address: Address; role: AccountRole },
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
      role: AccountRole.READONLY_SIGNER,
    },
  ];
  return [metas, authorityIndex];
}

export type SubAccountWithdrawV1TokenAccountMetasWithAuthority = [
  ...SubAccountWithdrawV1TokenAccountMetas,
  { address: Address; role: AccountRole },
];

export function getSubAccountWithdrawV1TokenAccountMetasWithAuthority(
  accounts: SubAccountWithdrawV1TokenInstructionAccounts,
  authority: Address,
): [SubAccountWithdrawV1TokenAccountMetasWithAuthority, number] {
  const accountMetas = getSubAccountWithdrawV1TokenAccountMetas(accounts);
  const authorityIndex = 3; // authority goes after subAccount

  const metas: SubAccountWithdrawV1TokenAccountMetasWithAuthority = [
    accountMetas[0], // swig
    accountMetas[1], // payer
    accountMetas[2], // sub-account
    {
      address: authority,
      role: AccountRole.READONLY_SIGNER,
    },
    accountMetas[3], // subAccountToken
    accountMetas[4], // swigToken
    accountMetas[5], // tokenProgram
  ];
  return [metas, authorityIndex];
}
