import {
  AccountRole,
  type Address,
  type ReadonlyAccount,
  type ReadonlySignerAccount,
  type WritableAccount,
} from '@solana/kit';

export type SubAccountToggleV1InstructionAccounts = {
  swig: Address;
  payer: Address;
  subAccount: Address;
};

export type SubAccountToggleV1BaseAccountMetas = [
  ReadonlyAccount,
  ReadonlySignerAccount,
  WritableAccount,
];

export function getSubAccountToggleV1BaseAccountMetas(
  accounts: SubAccountToggleV1InstructionAccounts,
): SubAccountToggleV1BaseAccountMetas {
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

export type SubAccountToggleV1BaseAccountMetasWithAuthority = [
  ...SubAccountToggleV1BaseAccountMetas,
  ReadonlySignerAccount,
];

export function getSubAccountToggleV1BaseAccountMetasWithAuthority(
  accounts: SubAccountToggleV1InstructionAccounts,
  authority: Address,
): [SubAccountToggleV1BaseAccountMetasWithAuthority, number] {
  const accountMetas = getSubAccountToggleV1BaseAccountMetas(accounts);
  const authorityIndex = accountMetas.length;

  const metas: SubAccountToggleV1BaseAccountMetasWithAuthority = [
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

// export type SubAccountToggleV1BaseAccountMetasWithSystemProgram = [
//   ...SubAccountToggleV1BaseAccountMetas,
//   ReadonlyAccount,
// ];

// export function getSubAccountToggleV1BaseAccountMetasWithSystemProgram(
//   accounts: SubAccountToggleV1InstructionAccounts,
// ): SubAccountToggleV1BaseAccountMetasWithSystemProgram {
//   const accountMetas = getSubAccountToggleV1BaseAccountMetas(accounts);

//   return [
//     ...accountMetas,
//     {
//       pubkey: SystemProgram.programId,
//       isSigner: false,
//       isWritable: false,
//     },
//   ];
// }
