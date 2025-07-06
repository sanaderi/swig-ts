import { AccountRole } from '@solana/kit';
import { SYSTEM_PROGRAM_ADDRESS } from '../consts';
import {
  SolAccountMeta,
  SolanaPublicKey,
  type SolanaPublicKeyData,
} from '../schema';

export type CreateV1InstructionAccounts = {
  swig: SolanaPublicKeyData;
  payer: SolanaPublicKeyData;
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
