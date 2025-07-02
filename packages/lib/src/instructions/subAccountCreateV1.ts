import {
  AccountRole,
  type Address,
  type ReadonlyAccount,
  type ReadonlySignerAccount,
  type WritableAccount,
  type WritableSignerAccount,
} from '@solana/kit';
import { SYSTEM_PROGRAM_ADDRESS } from '../consts';

export type SubAccountCreateV1InstructionAccounts = {
  swig: Address;
  payer: Address;
  subAccount: Address;
};

export type SubAccountCreateV1BaseAccountMetas = [
  WritableAccount,
  WritableSignerAccount,
  WritableAccount,
  ReadonlyAccount<typeof SYSTEM_PROGRAM_ADDRESS>,
];

export function getSubAccountCreateV1BaseAccountMetas(
  accounts: SubAccountCreateV1InstructionAccounts,
): SubAccountCreateV1BaseAccountMetas {
  return [
    {
      address: accounts.swig,
      role: AccountRole.WRITABLE,
      // isSigner: false,
      // isWritable: true,
    },
    {
      address: accounts.payer,
      role: AccountRole.WRITABLE_SIGNER,
      // isSigner: true,
      // isWritable: true,
    },
    {
      address: accounts.subAccount,
      role: AccountRole.WRITABLE,
      // isSigner: false,
      // isWritable: true,
    },
    {
      address: SYSTEM_PROGRAM_ADDRESS,
      role: AccountRole.READONLY,
      // isSigner: false,
      // isWritable: false,
    },
  ];
}

export type SubAccountCreateV1BaseAccountMetasWithAuthority = [
  ...SubAccountCreateV1BaseAccountMetas,
  ReadonlySignerAccount,
];

export function getSubAccountCreateV1BaseAccountMetasWithAuthority(
  accounts: SubAccountCreateV1InstructionAccounts,
  authority: Address,
): [SubAccountCreateV1BaseAccountMetasWithAuthority, number] {
  const accountMetas = getSubAccountCreateV1BaseAccountMetas(accounts);
  const authorityIndex = accountMetas.length;

  const metas: SubAccountCreateV1BaseAccountMetasWithAuthority = [
    ...accountMetas,
    {
      address: authority,
      role: AccountRole.READONLY_SIGNER,
      // isSigner: true,
      // isWritable: false,
    },
  ];
  return [metas, authorityIndex];
}

// export type SubAccountCreateV1BaseAccountMetasWithSystemProgram = [
//   ...SubAccountCreateV1BaseAccountMetas,
//   ReadonlyAccount<>,
// ];

// export function getSubAccountCreateV1BaseAccountMetasWithSystemProgram(
//   accounts: SubAccountCreateV1InstructionAccounts,
// ): SubAccountCreateV1BaseAccountMetasWithSystemProgram {
//   const accountMetas = getSubAccountCreateV1BaseAccountMetas(accounts);

//   return [
//     ...accountMetas,
//     {
//       pubkey: SystemProgram.programId,
//       isSigner: false,
//       isWritable: false,
//     },
//   ];
// }
