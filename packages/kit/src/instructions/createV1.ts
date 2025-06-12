import {
  SystemProgram,
  type AccountMeta,
  type PublicKey,
} from '@solana/web3.js';

export type CreateV1InstructionAccounts = {
  swig: PublicKey;
  payer: PublicKey;
};

export type CreateV1BaseAccountMetas = [AccountMeta, AccountMeta, AccountMeta];

export function getCreateV1BaseAccountMetas(
  accounts: CreateV1InstructionAccounts,
): CreateV1BaseAccountMetas {
  return [
    {
      pubkey: accounts.swig,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: accounts.payer,
      isSigner: true,
      isWritable: true,
    },
    {
      pubkey: SystemProgram.programId,
      isSigner: false,
      isWritable: false,
    },
  ];
}
