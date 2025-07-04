// import {
//   AccountRole,
//   type Address,
//   type ReadonlyAccount,
//   type ReadonlySignerAccount,
//   type WritableAccount,
//   type WritableSignerAccount,
// } from '@solana/kit';
// import { SYSTEM_PROGRAM_ADDRESS } from '../consts';

// export type ReplaceAuthorityV1InstructionAccounts = {
//   swig: Address;
//   payer: Address;
// };

// export type ReplaceAuthorityV1BaseAccountMetas = [
//   WritableAccount,
//   WritableSignerAccount,
//   ReadonlyAccount<typeof SYSTEM_PROGRAM_ADDRESS>,
// ];

// export function getReplaceAuthorityV1BaseAccountMetas(
//   accounts: ReplaceAuthorityV1InstructionAccounts,
// ): ReplaceAuthorityV1BaseAccountMetas {
//   return [
//     {
//       address: accounts.swig,
//       role: AccountRole.WRITABLE,
//       // isSigner: false,
//       // isWritable: true,
//     },
//     {
//       address: accounts.payer,
//       role: AccountRole.WRITABLE_SIGNER,
//       // isSigner: true,
//       // isWritable: true,
//     },
//     {
//       address: SYSTEM_PROGRAM_ADDRESS,
//       role: AccountRole.READONLY,
//       // isSigner: false,
//       // isWritable: false,
//     },
//   ];
// }

// export type ReplaceAuthorityV1BaseAccountMetasWithAuthority = [
//   ...ReplaceAuthorityV1BaseAccountMetas,
//   ReadonlySignerAccount,
// ];

// export function getReplaceV1BaseAccountMetasWithAuthority(
//   accounts: ReplaceAuthorityV1InstructionAccounts,
//   authority: Address,
// ): [ReplaceAuthorityV1BaseAccountMetasWithAuthority, number] {
//   const accountMetas = getReplaceAuthorityV1BaseAccountMetas(accounts);
//   const authorityIndex = accountMetas.length;

//   const metas: ReplaceAuthorityV1BaseAccountMetasWithAuthority = [
//     ...accountMetas,
//     {
//       address: authority,
//       role: AccountRole.READONLY_SIGNER,
//       // isSigner: true,
//       // isWritable: false,
//     },
//   ];
//   return [metas, authorityIndex];
// }
