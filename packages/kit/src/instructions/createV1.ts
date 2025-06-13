import { AccountRole, Address } from '@solana/kit';
import { SYSTEM_PROGRAM_ADDRESS } from '../consts';

export type CreateV1InstructionAccounts = {
  swig: Address;
  payer: Address;
};

export type CreateV1BaseAccountMetas = [
  { address: Address; role: AccountRole },
  { address: Address; role: AccountRole },
  { address: Address; role: AccountRole },
];

export function getCreateV1BaseAccountMetas(
  accounts: CreateV1InstructionAccounts,
): CreateV1BaseAccountMetas {
  return [
    {
      address: accounts.swig,
      role: AccountRole.WRITABLE,
    },
    {
      address: accounts.payer,
      role: AccountRole.WRITABLE_SIGNER,
    },
    {
      address: SYSTEM_PROGRAM_ADDRESS,
      role: AccountRole.READONLY,
    },
  ];
}
