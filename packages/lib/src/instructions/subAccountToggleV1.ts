import { AccountRole } from '@solana/kit';
import { SolAccountMeta, type SolanaPublicKey } from '../schema';

export type SubAccountToggleV1InstructionAccounts = {
  swig: SolanaPublicKey;
  payer: SolanaPublicKey;
  subAccount: SolanaPublicKey;
};

export type SubAccountToggleV1BaseAccountMetas = [
  SolAccountMeta,
  SolAccountMeta,
  SolAccountMeta,
];

export function getSubAccountToggleV1BaseAccountMetas(
  accounts: SubAccountToggleV1InstructionAccounts,
): SubAccountToggleV1BaseAccountMetas {
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

export type SubAccountToggleV1BaseAccountMetasWithAuthority = [
  ...SubAccountToggleV1BaseAccountMetas,
  SolAccountMeta,
];

export function getSubAccountToggleV1BaseAccountMetasWithAuthority(
  accounts: SubAccountToggleV1InstructionAccounts,
  authority: SolanaPublicKey,
): [SubAccountToggleV1BaseAccountMetasWithAuthority, number] {
  const accountMetas = getSubAccountToggleV1BaseAccountMetas(accounts);
  const authorityIndex = accountMetas.length;

  const metas: SubAccountToggleV1BaseAccountMetasWithAuthority = [
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
