import { type CompactInstruction } from '@swig-wallet/coder';
import { SolAccountMeta, SolanaPublicKey, SolInstruction } from '../schema';

/**
 * Convert TransactionInstructions to CompactInstructions
 * @param swigAccount Swig account
 * @param accounts SignInstruction AccountMetas
 * @param innerInstructions Transaction instructions to convert
 * @returns Object with Combined AccountMetas (accounts) & CompactInstructions (compactIxs)
 */
export function compactInstructions<T extends SolAccountMeta[] = SolAccountMeta[]>(
  swigAccount: SolanaPublicKey,
  accounts: T,
  innerInstructions: SolInstruction[],
  subAccount?: SolanaPublicKey,
): { accounts: T; compactIxs: CompactInstruction[] } {
  const compactIxs: CompactInstruction[] = [];

  const hashmap = new Map<string, number>(
    accounts.map((x, i) => [x.publicKey.toBase58(), i]),
  );

  for (const ix of innerInstructions) {
    const programIdIndex = accounts.length;

    accounts.push(SolAccountMeta.readonly(ix.program));

    const accts: number[] = [];
    for (const ixAccount of ix.accounts) {
      if (
        ixAccount.publicKey.toBase58() === swigAccount.toBase58() ||
        ixAccount.publicKey.toBase58() === subAccount?.toBase58()
      ) {
        ixAccount.setSigner(false);
      }

      const accountIndex = hashmap.get(ixAccount.publicKey.toBase58());
      if (accountIndex !== undefined) {
        accts.push(accountIndex);
      } else {
        const idx = accounts.length;
        hashmap.set(ixAccount.publicKey.toBase58(), idx);
        accounts.push(ixAccount);
        accts.push(idx);
      }
    }

    compactIxs.push({
      programIdIndex,
      accounts: accts,
      data: ix.data,
    });
  }

  return { accounts, compactIxs };
}

// /**
//  * Convert TransactionInstructions to CompactInstructions
//  * @param swigAccount Swig account
//  * @param accounts SignInstruction AccountMetas
//  * @param innerInstructions Transaction instructions to convert
//  * @returns Object with Combined AccountMetas (accounts) & CompactInstructions (compactIxs)
//  */
// export function compactInstructions<
//   T extends [...(SignV1BaseAccountMetas | SubAccountSignV1BaseAccountMetas), ...IAccountMeta[]],
// >(
//   swigAccount: Address,
//   accounts: T,
//   innerInstructions: GenericInstruction[],
//   subAccount?: Address,
// ): { accounts: T; compactIxs: CompactInstruction[] } {
//   const compactIxs: CompactInstruction[] = [];
//   const hashmap = new Map<string, number>(
//     accounts.map((x, i) => [x.address, i]),
//   );

//   for (const ix of innerInstructions) {
//     const programIdIndex = accounts.length;
//     accounts.push({ address: ix.programAddress, role: AccountRole.READONLY });

//     const accts: number[] = [];
//     for (const ixAccount of ix.accounts) {
//       let { address, role } = ixAccount;
//       if (
//         address.toString() === swigAccount.toString() ||
//         address.toString() === subAccount?.toString()
//       ) {
//         if (isWritableRole(role)) {
//           role = AccountRole.WRITABLE;
//         } else {
//           role = AccountRole.READONLY;
//         }
//       }

//       const accountIndex = hashmap.get(address);
//       if (accountIndex !== undefined) {
//         accts.push(accountIndex);
//       } else {
//         const idx = accounts.length;
//         hashmap.set(address, idx);
//         accounts.push({ address, role });
//         accts.push(idx);
//       }
//     }

//     compactIxs.push({
//       programIdIndex,
//       accounts: accts,
//       data: ix.data,
//     });
//   }

//   return { accounts, compactIxs };
// }
