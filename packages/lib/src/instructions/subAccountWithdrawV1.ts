import {
  AccountRole,
  type ReadonlyAccount,
  type ReadonlySignerAccount,
  type WritableAccount,
} from '@solana/kit';
import { SolAccountMeta, type SolanaPublicKey } from '../schema';

export type SubAccountWithdrawV1BaseInstructionAccounts = {
  swig: SolanaPublicKey;
  payer: SolanaPublicKey;
  subAccount: SolanaPublicKey;
};

export type SubAccountWithdrawV1SolInstructionAccounts =
  SubAccountWithdrawV1BaseInstructionAccounts;

export type SubAccountWithdrawV1TokenInstructionAccounts =
  SubAccountWithdrawV1BaseInstructionAccounts & {
    subAccountToken: SolanaPublicKey;
    swigToken: SolanaPublicKey;
    tokenProgram: SolanaPublicKey;
  };

export type SubAccountWithdrawV1BaseAccountMetas = [
  SolAccountMeta,
  SolAccountMeta,
  SolAccountMeta,
];

export type SubAccountWithdrawV1SolAccountMetas =
  SubAccountWithdrawV1BaseAccountMetas;

export type SubAccountWithdrawV1TokenAccountMetas = [
  ...SubAccountWithdrawV1BaseAccountMetas,
  SolAccountMeta,
  SolAccountMeta,
  SolAccountMeta,
];

export function getSubAccountWithdrawV1SolAccountMetas(
  accounts: SubAccountWithdrawV1SolInstructionAccounts,
): SubAccountWithdrawV1SolAccountMetas {
  return [
    SolAccountMeta.fromKitAccountMeta({
      address: accounts.swig.toAddress(),
      role: AccountRole.READONLY,
      // isSigner: false,
      // isWritable: false,
    }),
    SolAccountMeta.fromKitAccountMeta({
      address: accounts.payer.toAddress(),
      role: AccountRole.READONLY_SIGNER,
      // isSigner: true,
      // isWritable: false,
    }),
    SolAccountMeta.fromKitAccountMeta({
      address: accounts.subAccount.toAddress(),
      role: AccountRole.WRITABLE,
      // isSigner: false,
      // isWritable: true,
    }),
  ];
}

export function getSubAccountWithdrawV1TokenAccountMetas(
  accounts: SubAccountWithdrawV1TokenInstructionAccounts,
): SubAccountWithdrawV1TokenAccountMetas {
  return [
    SolAccountMeta.fromKitAccountMeta({
      address: accounts.swig.toAddress(),
      role: AccountRole.READONLY,
      // isSigner: false,
      // isWritable: false,
    }),
    SolAccountMeta.fromKitAccountMeta({
      address: accounts.payer.toAddress(),
      role: AccountRole.READONLY_SIGNER,
      // isSigner: true,
      // isWritable: false,
    }),
    SolAccountMeta.fromKitAccountMeta({
      address: accounts.subAccount.toAddress(),
      role: AccountRole.WRITABLE,
      // isSigner: false,
      // isWritable: true,
    }),
    SolAccountMeta.fromKitAccountMeta({
      address: accounts.subAccountToken.toAddress(),
      role: AccountRole.WRITABLE,
      // isSigner: false,
      // isWritable: true,
    }),
    SolAccountMeta.fromKitAccountMeta({
      address: accounts.swigToken.toAddress(),
      role: AccountRole.WRITABLE,
      // isSigner: false,
      // isWritable: true,
    }),
    SolAccountMeta.fromKitAccountMeta({
      address: accounts.tokenProgram.toAddress(),
      role: AccountRole.READONLY,
      // isSigner: false,
      // isWritable: false,
    }),
  ];
}

export type SubAccountWithdrawV1SolAccountMetasWithAuthority = [
  ...SubAccountWithdrawV1SolAccountMetas,
  SolAccountMeta,
];

export function getSubAccountWithdrawV1SolAccountMetasWithAuthority(
  accounts: SubAccountWithdrawV1SolInstructionAccounts,
  authority: SolanaPublicKey,
): [SubAccountWithdrawV1SolAccountMetasWithAuthority, number] {
  const accountMetas = getSubAccountWithdrawV1SolAccountMetas(accounts);
  const authorityIndex = accountMetas.length;

  const metas: SubAccountWithdrawV1SolAccountMetasWithAuthority = [
    ...accountMetas,
    SolAccountMeta.fromKitAccountMeta({
      address: authority.toAddress(),
      role: AccountRole.READONLY_SIGNER
      // isSigner: true,
      // isWritable: false,
    }),
  ];
  return [metas, authorityIndex];
}

export type SubAccountWithdrawV1TokenAccountMetasWithAuthority = [
  SubAccountWithdrawV1TokenAccountMetas[0],
  SubAccountWithdrawV1TokenAccountMetas[1],
  SubAccountWithdrawV1TokenAccountMetas[2],
  SolAccountMeta,
  SubAccountWithdrawV1TokenAccountMetas[3],
  SubAccountWithdrawV1TokenAccountMetas[4],
  SubAccountWithdrawV1TokenAccountMetas[5],
];

export function getSubAccountWithdrawV1TokenAccountMetasWithAuthority(
  accounts: SubAccountWithdrawV1TokenInstructionAccounts,
  authority: SolanaPublicKey,
): [SubAccountWithdrawV1TokenAccountMetasWithAuthority, number] {
  const accountMetas = getSubAccountWithdrawV1TokenAccountMetas(accounts);
  const authorityIndex = accountMetas.length;

  const metas: SubAccountWithdrawV1TokenAccountMetasWithAuthority = [
    accountMetas[0], // swig
    accountMetas[1], // payer
    accountMetas[2], // sub-account
    SolAccountMeta.fromKitAccountMeta({
      address: authority.toAddress(),
      role: AccountRole.READONLY_SIGNER,
      // isSigner: true,
      // isWritable: false,
    }),
    accountMetas[3], // swig sub-account token
    accountMetas[4], // swig token
    accountMetas[5], // token program
  ];
  return [metas, authorityIndex];
}
