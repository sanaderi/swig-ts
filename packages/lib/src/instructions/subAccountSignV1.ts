import { AccountRole } from '@solana/kit';
import { SYSTEM_PROGRAM_ADDRESS } from '../consts';
import { SolAccountMeta, SolanaPublicKey, type SolanaPublicKeyData } from '../schema';

export type SubAccountSignV1InstructionAccounts = {
  swig: SolanaPublicKeyData;
  payer: SolanaPublicKeyData;
  subAccount: SolanaPublicKeyData;
};

export type SubAccountSignV1BaseAccountMetas = [
  SolAccountMeta,
  SolAccountMeta,
  SolAccountMeta,
  SolAccountMeta,
];

export function getSubAccountSignV1BaseAccountMetas(
  accounts: SubAccountSignV1InstructionAccounts,
): SubAccountSignV1BaseAccountMetas {
  return [
    SolAccountMeta.fromKitAccountMeta({
      address: new SolanaPublicKey(accounts.swig).toAddress(),
      role: AccountRole.READONLY,
      // isSigner: false,
      // isWritable: false,
    }),
    SolAccountMeta.fromKitAccountMeta({
      address: new SolanaPublicKey(accounts.payer).toAddress(),
      role: AccountRole.READONLY_SIGNER,
      // isSigner: true,
      // isWritable: false,
    }),
    SolAccountMeta.fromKitAccountMeta({
      address: new SolanaPublicKey(accounts.subAccount).toAddress(),
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

export type SubAccountSignV1BaseAccountMetasWithAuthority = [
  ...SubAccountSignV1BaseAccountMetas,
  SolAccountMeta,
];

export function getSubAccountSignV1BaseAccountMetasWithAuthority(
  accounts: SubAccountSignV1InstructionAccounts,
  authority: SolanaPublicKeyData,
): [SubAccountSignV1BaseAccountMetasWithAuthority, number] {
  const accountMetas = getSubAccountSignV1BaseAccountMetas(accounts);
  const authorityIndex = accountMetas.length;

  const metas: SubAccountSignV1BaseAccountMetasWithAuthority = [
    ...accountMetas,
    SolAccountMeta.fromKitAccountMeta({
      address: new SolanaPublicKey(authority).toAddress(),
      role: AccountRole.READONLY_SIGNER,
      // isSigner: true,
      // isWritable: false,
    }),
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
