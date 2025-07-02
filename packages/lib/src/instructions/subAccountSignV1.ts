import {
  AccountRole,
  type Address,
  type ReadonlyAccount,
  type ReadonlySignerAccount,
  type WritableAccount,
  type WritableSignerAccount,
} from '@solana/kit';
import { SYSTEM_PROGRAM_ADDRESS } from '../consts';

export type SubAccountSignV1InstructionAccounts = {
  swig: Address;
  payer: Address;
  subAccount: Address;
};

export type SubAccountSignV1BaseAccountMetas = [
  ReadonlyAccount,
  ReadonlySignerAccount,
  WritableAccount,
  ReadonlyAccount<typeof SYSTEM_PROGRAM_ADDRESS>,
];

export function getSubAccountSignV1BaseAccountMetas(
  accounts: SubAccountSignV1InstructionAccounts,
): SubAccountSignV1BaseAccountMetas {
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
      address: SYSTEM_PROGRAM_ADDRESS,
      role: AccountRole.READONLY,
      // isSigner: false,
      // isWritable: false,
    },
  ];
}

export type SubAccountSignV1BaseAccountMetasWithAuthority = [
  ...SubAccountSignV1BaseAccountMetas,
  ReadonlySignerAccount,
];

export function getSubAccountSignV1BaseAccountMetasWithAuthority(
  accounts: SubAccountSignV1InstructionAccounts,
  authority: Address,
): [SubAccountSignV1BaseAccountMetasWithAuthority, number] {
  const accountMetas = getSubAccountSignV1BaseAccountMetas(accounts);
  const authorityIndex = accountMetas.length;

  const metas: SubAccountSignV1BaseAccountMetasWithAuthority = [
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

// export type SubAccountSignV1BaseAccountMetasWithSystemProgram = [
//   ...SubAccountSignV1BaseAccountMetas,
//   AccountMeta,
// ];

// export function getSubAccountSignV1BaseAccountMetasWithSystemProgram(
//   accounts: SubAccountSignV1InstructionAccounts,
// ): SubAccountSignV1BaseAccountMetasWithSystemProgram {
//   const accountMetas = getSubAccountSignV1BaseAccountMetas(accounts);

//   return [
//     ...accountMetas,
//     {
//       pubkey: SystemProgram.programId,
//       isSigner: false,
//       isWritable: false,
//     },
//   ];
// }
