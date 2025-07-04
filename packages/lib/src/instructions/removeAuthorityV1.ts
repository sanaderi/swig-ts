import {
  AccountRole,
  type ReadonlyAccount,
  type ReadonlySignerAccount,
  type WritableAccount,
  type WritableSignerAccount,
} from '@solana/kit';
import { SYSTEM_PROGRAM_ADDRESS } from '../consts';
import { SolAccountMeta, type SolanaPublicKey } from '../schema';

export type RemoveAuthorityV1InstructionAccounts = {
  swig: SolanaPublicKey;
  payer: SolanaPublicKey;
};

export type RemoveAuthorityV1BaseAccountMetas = [
  SolAccountMeta,
  SolAccountMeta,
  SolAccountMeta,
];

export function getRemoveAuthorityV1BaseAccountMetas(
  accounts: RemoveAuthorityV1InstructionAccounts,
): RemoveAuthorityV1BaseAccountMetas {
  return [
    SolAccountMeta.fromKitAccountMeta({
      address: accounts.swig.toAddress(),
      role: AccountRole.WRITABLE,
    }),
    SolAccountMeta.fromKitAccountMeta({
      address: accounts.payer.toAddress(),
      role: AccountRole.WRITABLE_SIGNER,
    }),
    SolAccountMeta.fromKitAccountMeta({
      address: SYSTEM_PROGRAM_ADDRESS,
      role: AccountRole.READONLY,
    }),
  ];
}

export type RemoveAuthorityV1BaseAccountMetasWithAuthority = [
  ...RemoveAuthorityV1BaseAccountMetas,
  SolAccountMeta,
];

export function getRemoveV1BaseAccountMetasWithAuthority(
  accounts: RemoveAuthorityV1InstructionAccounts,
  authority: SolanaPublicKey,
): [RemoveAuthorityV1BaseAccountMetasWithAuthority, number] {
  const accountMetas = getRemoveAuthorityV1BaseAccountMetas(accounts);
  const authorityIndex = accountMetas.length;

  const metas: RemoveAuthorityV1BaseAccountMetasWithAuthority = [
    ...accountMetas,
    SolAccountMeta.fromKitAccountMeta({
      address: authority.toAddress(),
      role: AccountRole.READONLY_SIGNER,
      // isSigner: true,
      // isWritable: false,
    }),
  ];
  return [metas, authorityIndex];
}
