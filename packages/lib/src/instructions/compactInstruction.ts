import { type CompactInstruction } from '@swig-wallet/coder';
import {
  SolAccountMeta,
  SolInstruction,
  SolPublicKey,
  type SolPublicKeyData,
} from '../solana';

/**
 * Convert TransactionInstructions to CompactInstructions
 * @param swigAccount Swig account
 * @param accounts SignInstruction AccountMetas
 * @param innerInstructions Transaction instructions to convert
 * @returns Object with Combined AccountMetas (accounts) & CompactInstructions (compactIxs)
 */
export function compactInstructions<
  T extends SolAccountMeta[] = SolAccountMeta[],
>(
  swigAccount: SolPublicKeyData,
  accounts: T,
  innerInstructions: SolInstruction[],
  subAccount?: SolPublicKeyData,
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
      const subAcct = subAccount ? new SolPublicKey(subAccount) : undefined;
      if (
        ixAccount.publicKey.toBase58() ===
          new SolPublicKey(swigAccount).toBase58() ||
        ixAccount.publicKey.toBase58() === subAcct?.toBase58()
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
