import { address } from '@solana/kit';
import bs58 from 'bs58';
import { Ed25519Instruction } from '../src/authority/instructions/ed25519';
import { Secp256k1Instruction } from '../src/authority/instructions/secp256k1';

// Dummy data helpers
const dummyAddress = (label: string) =>
  address(bs58.encode(Buffer.from(label.padEnd(32, '1'))));

const dummyUint8 = (len = 32) => new Uint8Array(len).fill(1);

const dummyOptions = {
  signingFn: async () => ({ signature: dummyUint8(64) }),
  currentSlot: 123n,
};

const dummyKitIx = {
  programAddress: dummyAddress('prog'),
  keys: [],
  data: dummyUint8(8),
};

const dummyInnerInstructions = [dummyKitIx];

describe('Ed25519Instruction', () => {
  const authorityData = dummyUint8(32);

  it('addAuthorityV1Instruction', async () => {
    const accounts = {
      swig: dummyAddress('swig'),
      payer: dummyAddress('payer'),
    };
    const data = {
      authorityData,
      actingRoleId: 1,
      actions: dummyUint8(),
      newAuthorityData: dummyUint8(),
      newAuthorityType: 0,
      noOfActions: 1,
    };
    const ix = await Ed25519Instruction.addAuthorityV1Instruction(
      accounts,
      data,
    );
    expect(ix).toHaveProperty('keys');
    expect(ix).toHaveProperty('programAddress');
    expect(ix).toHaveProperty('data');
  });

  it('removeAuthorityV1Instruction', async () => {
    const accounts = {
      swig: dummyAddress('swig'),
      payer: dummyAddress('payer'),
    };
    const data = { authorityData, actingRoleId: 1, authorityToRemoveId: 2 };
    const ix = await Ed25519Instruction.removeAuthorityV1Instruction(
      accounts,
      data,
    );
    expect(ix).toHaveProperty('keys');
  });

  it('signV1Instruction', async () => {
    const accounts = {
      swig: dummyAddress('swig'),
      payer: dummyAddress('payer'),
    };
    const data = {
      authorityData,
      roleId: 1,
      innerInstructions: dummyInnerInstructions,
    };
    const ix = await Ed25519Instruction.signV1Instruction(accounts, data);
    expect(ix).toHaveProperty('keys');
  });

  it('createSessionV1Instruction', async () => {
    const accounts = {
      swig: dummyAddress('swig'),
      payer: dummyAddress('payer'),
    };
    const data = {
      authorityData,
      roleId: 1,
      sessionDuration: 10n,
      sessionKey: dummyUint8(),
    };
    const ix = await Ed25519Instruction.createSessionV1Instruction(
      accounts,
      data,
    );
    expect(ix).toHaveProperty('keys');
  });

  it('subAccountCreateV1Instruction', async () => {
    const accounts = {
      swig: dummyAddress('swig'),
      payer: dummyAddress('payer'),
      subAccount: dummyAddress('sub'),
    };
    const data = {
      authorityData,
      subAccountId: dummyUint8(),
      authorityType: 0,
      actions: dummyUint8(),
      noOfActions: 1,
      subAccountData: dummyUint8(),
      roleId: 1,
      bump: 1,
    };
    const ix = await Ed25519Instruction.subAccountCreateV1Instruction(
      accounts,
      data,
    );
    expect(ix).toHaveProperty('keys');
  });

  it('subAccountWithdrawV1SolInstruction', async () => {
    const accounts = {
      swig: dummyAddress('swig'),
      payer: dummyAddress('payer'),
      subAccount: dummyAddress('sub'),
    };
    const data = {
      authorityData,
      subAccountId: dummyUint8(),
      amount: 1n,
      roleId: 1,
    };
    const ix = await Ed25519Instruction.subAccountWithdrawV1SolInstruction(
      accounts,
      data,
    );
    expect(ix).toHaveProperty('keys');
  });

  it('subAccountWithdrawV1TokenInstruction', async () => {
    const accounts = {
      swig: dummyAddress('swig'),
      payer: dummyAddress('payer'),
      subAccount: dummyAddress('sub'),
      subAccountToken: dummyAddress('tok'),
      swigToken: dummyAddress('stok'),
      tokenProgram: dummyAddress('prog'),
    };
    const data = {
      authorityData,
      subAccountId: dummyUint8(),
      amount: 1n,
      roleId: 1,
    };
    const ix = await Ed25519Instruction.subAccountWithdrawV1TokenInstruction(
      accounts,
      data,
    );
    expect(ix).toHaveProperty('keys');
  });

  it('subAccountToggleV1Instruction', async () => {
    const accounts = {
      swig: dummyAddress('swig'),
      payer: dummyAddress('payer'),
      subAccount: dummyAddress('sub'),
    };
    const data = {
      authorityData,
      subAccountId: dummyUint8(),
      enabled: true,
      roleId: 1,
    };
    const ix = await Ed25519Instruction.subAccountToggleV1Instruction(
      accounts,
      data,
    );
    expect(ix).toHaveProperty('keys');
  });

  it('subAccountSignV1Instruction', async () => {
    const accounts = {
      swig: dummyAddress('swig'),
      payer: dummyAddress('payer'),
      subAccount: dummyAddress('sub'),
    };
    const data = {
      authorityData,
      roleId: 1,
      innerInstructions: dummyInnerInstructions,
    };
    const ix = await Ed25519Instruction.subAccountSignV1Instruction(
      accounts,
      data,
    );
    expect(ix).toHaveProperty('keys');
  });
});

describe('Secp256k1Instruction', () => {
  it('addAuthorityV1Instruction', async () => {
    const accounts = {
      swig: dummyAddress('swig'),
      payer: dummyAddress('payer'),
    };
    const data = {
      authorityData: dummyUint8(32),
      actingRoleId: 1,
      newAuthorityType: 0,
      noOfActions: 1,
      newAuthorityData: dummyUint8(32),
      actions: dummyUint8(32),
    };
    const ix = await Secp256k1Instruction.addAuthorityV1Instruction(
      accounts,
      data,
      dummyOptions,
    );
    expect(ix).toHaveProperty('keys');
  });

  it('removeAuthorityV1Instruction', async () => {
    const accounts = {
      swig: dummyAddress('swig'),
      payer: dummyAddress('payer'),
    };
    const data = {
      authorityData: dummyUint8(32),
      actingRoleId: 1,
      authorityToRemoveId: 2,
    };
    const ix = await Secp256k1Instruction.removeAuthorityV1Instruction(
      accounts,
      data,
      dummyOptions,
    );
    expect(ix).toHaveProperty('keys');
  });

  it('signV1Instruction', async () => {
    const accounts = {
      swig: dummyAddress('swig'),
      payer: dummyAddress('payer'),
    };
    const data = {
      authorityData: dummyUint8(32),
      roleId: 1,
      innerInstructions: dummyInnerInstructions,
    };
    const ix = await Secp256k1Instruction.signV1Instruction(
      accounts,
      data,
      dummyOptions,
    );
    expect(ix).toHaveProperty('keys');
  });

  it('createSessionV1Instruction', async () => {
    const accounts = {
      swig: dummyAddress('swig'),
      payer: dummyAddress('payer'),
    };
    const data = {
      authorityData: dummyUint8(32),
      roleId: 1,
      sessionDuration: 10n,
      sessionKey: dummyUint8(32),
    };
    const ix = await Secp256k1Instruction.createSessionV1Instruction(
      accounts,
      data,
      dummyOptions,
    );
    expect(ix).toHaveProperty('keys');
  });

  it('subAccountCreateV1Instruction', async () => {
    const accounts = {
      swig: dummyAddress('swig'),
      payer: dummyAddress('payer'),
      subAccount: dummyAddress('sub'),
    };
    const data = {
      authorityData: dummyUint8(32),
      roleId: 1,
      bump: 1,
    };
    const ix = await Secp256k1Instruction.subAccountCreateV1Instruction(
      accounts,
      data,
      dummyOptions,
    );
    expect(ix).toHaveProperty('keys');
  });

  it('subAccountWithdrawV1SolInstruction', async () => {
    const accounts = {
      swig: dummyAddress('swig'),
      payer: dummyAddress('payer'),
      subAccount: dummyAddress('sub'),
    };
    const data = {
      authorityData: dummyUint8(32),
      roleId: 1,
      amount: 1n,
    };
    const ix = await Secp256k1Instruction.subAccountWithdrawV1SolInstruction(
      accounts,
      data,
      dummyOptions,
    );
    expect(ix).toHaveProperty('keys');
  });

  it('subAccountWithdrawV1TokenInstruction', async () => {
    const accounts = {
      swig: dummyAddress('swig'),
      payer: dummyAddress('payer'),
      subAccount: dummyAddress('sub'),
      subAccountToken: dummyAddress('tok'),
      swigToken: dummyAddress('stok'),
      tokenProgram: dummyAddress('prog'),
    };
    const data = {
      authorityData: dummyUint8(32),
      roleId: 1,
      amount: 1n,
    };
    const ix = await Secp256k1Instruction.subAccountWithdrawV1TokenInstruction(
      accounts,
      data,
      dummyOptions,
    );
    expect(ix).toHaveProperty('keys');
  });

  it('subAccountToggleV1Instruction', async () => {
    const accounts = {
      swig: dummyAddress('swig'),
      payer: dummyAddress('payer'),
      subAccount: dummyAddress('sub'),
    };
    const data = {
      authorityData: dummyUint8(32),
      enabled: true,
      roleId: 1,
    };
    const ix = await Secp256k1Instruction.subAccountToggleV1Instruction(
      accounts,
      data,
      dummyOptions,
    );
    expect(ix).toHaveProperty('keys');
  });

  it('subAccountSignV1Instruction', async () => {
    const accounts = {
      swig: dummyAddress('swig'),
      payer: dummyAddress('payer'),
      subAccount: dummyAddress('sub'),
    };
    const data = {
      authorityData: dummyUint8(32),
      roleId: 1,
      innerInstructions: dummyInnerInstructions,
    };
    const ix = await Secp256k1Instruction.subAccountSignV1Instruction(
      accounts,
      data,
      dummyOptions,
    );
    expect(ix).toHaveProperty('keys');
  });
});
