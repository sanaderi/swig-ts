import {
  AccountRole,
  type ReadonlyAccount,
  type ReadonlySignerAccount,
  type WritableAccount,
  type WritableSignerAccount,
} from '@solana/kit';
import { SYSTEM_PROGRAM_ADDRESS } from '../consts';
import { SolAccountMeta, type SolanaPublicKey } from '../schema';

export type SubAccountCreateV1InstructionAccounts = {
  swig: SolanaPublicKey;
  payer: SolanaPublicKey;
  subAccount: SolanaPublicKey;
};

export type SubAccountCreateV1BaseAccountMetas = [
  SolAccountMeta,
  SolAccountMeta,
  SolAccountMeta,
  SolAccountMeta,
];

export function getSubAccountCreateV1BaseAccountMetas(
  accounts: SubAccountCreateV1InstructionAccounts,
): SubAccountCreateV1BaseAccountMetas {
  return [
    SolAccountMeta.fromKitAccountMeta({
      address: accounts.swig.toAddress(),
      role: AccountRole.WRITABLE,
      // isSigner: false,
      // isWritable: true,
    }),
    SolAccountMeta.fromKitAccountMeta({
      address: accounts.payer.toAddress(),
      role: AccountRole.WRITABLE_SIGNER,
      // isSigner: true,
      // isWritable: true,
    }),
    SolAccountMeta.fromKitAccountMeta({
      address: accounts.subAccount.toAddress(),
      role: AccountRole.WRITABLE,
      // isSigner: false,
      // isWritable: true,
    }),
    SolAccountMeta.fromKitAccountMeta({
      address: SYSTEM_PROGRAM_ADDRESS,
      role: AccountRole.READONLY,
      // isSigner: false,
      // isWritable: false,
    }),
  ];
}

export type SubAccountCreateV1BaseAccountMetasWithAuthority = [
  ...SubAccountCreateV1BaseAccountMetas,
  SolAccountMeta,
];

export function getSubAccountCreateV1BaseAccountMetasWithAuthority(
  accounts: SubAccountCreateV1InstructionAccounts,
  authority: SolanaPublicKey,
): [SubAccountCreateV1BaseAccountMetasWithAuthority, number] {
  const accountMetas = getSubAccountCreateV1BaseAccountMetas(accounts);
  const authorityIndex = accountMetas.length;

  const metas: SubAccountCreateV1BaseAccountMetasWithAuthority = [
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
