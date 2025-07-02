import {
  AccountRole,
  isWritableRole,
  type Address,
  type IAccountMeta,
} from '@solana/kit';
import { type CompactInstruction } from '@swig-wallet/coder';
import type { GenericInstruction } from '../kit';
import type { SignV1BaseAccountMetas } from './signV1';
import type { SubAccountSignV1BaseAccountMetas } from './subAccountSignV1';

/**
 * Convert TransactionInstructions to CompactInstructions
 * @param swigAccount Swig account
 * @param accounts SignInstruction AccountMetas
 * @param innerInstructions Transaction instructions to convert
 * @returns Object with Combined AccountMetas (accounts) & CompactInstructions (compactIxs)
 */
export function compactInstructions<
  T extends [...(SignV1BaseAccountMetas | SubAccountSignV1BaseAccountMetas), ...IAccountMeta[]],
>(
  swigAccount: Address,
  accounts: T,
  innerInstructions: GenericInstruction[],
  subAccount?: Address,
): { accounts: T; compactIxs: CompactInstruction[] } {
  const compactIxs: CompactInstruction[] = [];
  const hashmap = new Map<string, number>(
    accounts.map((x, i) => [x.address, i]),
  );

  for (const ix of innerInstructions) {
    const programIdIndex = accounts.length;
    accounts.push({ address: ix.programAddress, role: AccountRole.READONLY });

    const accts: number[] = [];
    for (const ixAccount of ix.accounts) {
      let { address, role } = ixAccount;
      if (
        address.toString() === swigAccount.toString() ||
        address.toString() === subAccount?.toString()
      ) {
        if (isWritableRole(role)) {
          role = AccountRole.WRITABLE;
        } else {
          role = AccountRole.READONLY;
        }
      }

      const accountIndex = hashmap.get(address);
      if (accountIndex !== undefined) {
        accts.push(accountIndex);
      } else {
        const idx = accounts.length;
        hashmap.set(address, idx);
        accounts.push({ address, role });
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
