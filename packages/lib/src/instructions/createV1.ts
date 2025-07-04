import {
  AccountRole,
  type ReadonlyAccount,
  type WritableAccount,
  type WritableSignerAccount,
} from '@solana/kit';
import { SYSTEM_PROGRAM_ADDRESS } from '../consts';
import { SolAccountMeta, type SolanaPublicKey } from '../schema';

export type CreateV1InstructionAccounts = {
  swig: SolanaPublicKey;
  payer: SolanaPublicKey;
};

export type CreateV1BaseAccountMetas = [
  SolAccountMeta,
  SolAccountMeta,
  SolAccountMeta,
];

export function getCreateV1BaseAccountMetas(
  accounts: CreateV1InstructionAccounts,
): CreateV1BaseAccountMetas {
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
