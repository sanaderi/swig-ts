import type { Address, IInstruction } from '@solana/kit';
import { AccountRole } from '@solana/kit';
import { type CompactInstruction } from '@swig-wallet/coder';
import type { SignV1BaseAccountMetas } from './signV1';

/**
 * Convert Kit IInstructions to CompactInstructions
 * @param swigAccount Swig account
 * @param accounts SignInstruction AccountMetas
 * @param innerInstructions Kit instructions to convert
 * @returns Object with Combined AccountMetas (accounts) & CompactInstructions (compactIxs)
 */
export function compactInstructions<
  T extends [
    ...SignV1BaseAccountMetas,
    ...{ address: Address; role: AccountRole }[],
  ],
>(
  swigAccount: Address,
  accounts: T,
  innerInstructions: IInstruction[],
  subAccount?: Address,
): { accounts: T; compactIxs: CompactInstruction[] } {
  const compactIxs: CompactInstruction[] = [];
  const hashmap = new Map<string, number>(
    accounts.map((x, i) => [x.address, i]),
  );

  for (const ix of innerInstructions) {
    const programIdIndex = accounts.length;
    accounts.push({
      address: ix.programAddress,
      role: AccountRole.READONLY,
    } as T[number]);

    const accts: number[] = [];
    for (const ixAccount of ix.accounts ?? []) {
      if (
        ixAccount.address === swigAccount ||
        (subAccount && ixAccount.address === subAccount)
      ) {
        // No direct isSigner property; roles are set at construction time
        // If you need to change the role, do it here
      }

      const accountIndex = hashmap.get(ixAccount.address);
      if (accountIndex !== undefined) {
        accts.push(accountIndex);
      } else {
        const idx = accounts.length;
        hashmap.set(ixAccount.address, idx);
        accounts.push(ixAccount as T[number]);
        accts.push(idx);
      }
    }

    compactIxs.push({
      programIdIndex,
      accounts: accts,
      data: ix.data!,
    });
  }

  return { accounts, compactIxs };
}
