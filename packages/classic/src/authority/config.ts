import type { PublicKey } from '@solana/web3.js';
import { AuthorityType } from '@swig/coder';
import { Ed25519Instruction, Secp256k1Instruction } from './instructions';
import type { AuthorityInstruction } from './interface';

export type AuthorityConfig = {
  type: AuthorityType;
  session: boolean;
  instructions: AuthorityInstruction;
};

const Ed25519Config: AuthorityConfig = {
  type: AuthorityType.Ed25519,
  session: false,
  instructions: Ed25519Instruction,
};

const Ed25519SessionConfig: AuthorityConfig = {
  type: AuthorityType.Ed25519Session,
  session: true,
  instructions: Ed25519Instruction,
};

const Secp256k1Config: AuthorityConfig = {
  type: AuthorityType.Secp256k1,
  session: false,
  instructions: Secp256k1Instruction,
};

// const Secp256k1SessionConfig: AuthorityConfig = {
//   type: AuthorityType.Secp256k1Session,
//   session: true,
//   instructions: Secp256k1Instruction,
// };

const authorityConfig: Record<AuthorityType, AuthorityConfig> = {
  [AuthorityType.Ed25519]: Ed25519Config,
  [AuthorityType.Secp256k1]: Secp256k1Config,
  [AuthorityType.Ed25519Session]: Ed25519SessionConfig,
  [AuthorityType.None]: Ed25519Config,
};

export function getAuthorityConfig(type: AuthorityType): AuthorityConfig {
  return authorityConfig[type];
}
