import { Keypair } from '@solana/web3.js';
import { findSwigPda } from '@swig-wallet/classic';
import PAYER_KEYPAIR from '../../test-validator/keys/payer.json';

export const payerKeypair = Keypair.fromSecretKey(
  Uint8Array.from(PAYER_KEYPAIR),
);

export function getSwigAddress() {
  const swigId = new Uint8Array(32).fill(2);

  const [swigAddress] = findSwigPda(swigId);

  return { swigId, swigAddress };
}
