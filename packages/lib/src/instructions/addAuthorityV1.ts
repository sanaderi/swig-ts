import { AccountRole } from '@solana/kit';
import { SYSTEM_PROGRAM_ADDRESS } from '../consts';
import { SolAccountMeta, SolanaPublicKey, type SolanaPublicKeyData } from '../schema';

export type AddAuthorityV1InstructionAccounts = {
  swig: SolanaPublicKeyData;
  payer: SolanaPublicKeyData;
};

export type AddAuthorityV1BaseAccountMetas = [
  SolAccountMeta,
  SolAccountMeta,
  SolAccountMeta,
];

export function getAddAuthorityV1BaseAccountMetas(
  accounts: AddAuthorityV1InstructionAccounts,
): AddAuthorityV1BaseAccountMetas {
  return [
    SolAccountMeta.fromKitAccountMeta({
      address: new SolanaPublicKey(accounts.swig).toAddress(),
      role: AccountRole.WRITABLE,
    }),
    SolAccountMeta.fromKitAccountMeta({
      address: new SolanaPublicKey(accounts.payer).toAddress(),
      role: AccountRole.WRITABLE_SIGNER,
    }),
    SolAccountMeta.fromKitAccountMeta({
      address: SYSTEM_PROGRAM_ADDRESS,
      role: AccountRole.READONLY,
    }),
  ];
}

export type AddAuthorityV1BaseAccountMetasWithAuthority = [
  ...AddAuthorityV1BaseAccountMetas,
  SolAccountMeta,
];

export function getAddV1BaseAccountMetasWithAuthority(
  accounts: AddAuthorityV1InstructionAccounts,
  authority: SolanaPublicKeyData,
): [AddAuthorityV1BaseAccountMetasWithAuthority, number] {
  const accountMetas = getAddAuthorityV1BaseAccountMetas(accounts);
  const authorityIndex = accountMetas.length;

  const metas: AddAuthorityV1BaseAccountMetasWithAuthority = [
    ...accountMetas,
    SolAccountMeta.fromKitAccountMeta({
      address: new SolanaPublicKey(authority).toAddress(),
      role: AccountRole.READONLY_SIGNER,
    }),
  ];
  return [metas, authorityIndex];
}
