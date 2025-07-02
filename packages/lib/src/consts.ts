import { address } from '@solana/kit';
import { SolanaPublicKey } from './schema';

export const SWIG_PROGRAM_ADDRESS = address(
  'swigDk8JezhiAVde8k6NMwxpZfgGm2NNuMe1KYCmUjP',
);

export const SWIG_PROGRAM_SOLANA_PUBLICKEY = new SolanaPublicKey(SWIG_PROGRAM_ADDRESS)

export const SYSTEM_PROGRAM_ADDRESS = address(
  '11111111111111111111111111111111',
);

export const TOKEN_PROGRAM_ADDRESS = new SolanaPublicKey(
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
);
