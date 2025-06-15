import { AccountRole, type Address } from '@solana/kit';
import { AuthorityType } from '@swig-wallet/coder';
import { getAddAuthorityV1BaseAccountMetas } from '../src/instructions/addAuthorityV1';
import type { CreateV1BaseAccountMetas } from '../src/instructions/createV1';
import { getCreateV1BaseAccountMetas } from '../src/instructions/createV1';
import type { RemoveAuthorityV1BaseAccountMetas } from '../src/instructions/removeAuthorityV1';
import type { SignV1BaseAccountMetas } from '../src/instructions/signV1';
import type { SubAccountCreateV1BaseAccountMetas } from '../src/instructions/subAccountCreateV1';
import type { SubAccountSignV1BaseAccountMetas } from '../src/instructions/subAccountSignV1';
import type { SubAccountToggleV1BaseAccountMetas } from '../src/instructions/subAccountToggleV1';
import type { SubAccountWithdrawV1BaseAccountMetas } from '../src/instructions/subAccountWithdrawV1';
import { SwigInstructionV1 } from '../src/instructions/SwigInstruction';

test('getCreateV1BaseAccountMetas returns correct structure', () => {
  const accounts = {
    swig: 'Swig111111111111111111111111111111111111111' as any,
    payer: 'Payer1111111111111111111111111111111111111' as any,
  };
  const metas = getCreateV1BaseAccountMetas(accounts);
  expect(metas.length).toBe(3);
  expect(metas[0]).toHaveProperty('address', accounts.swig);
  expect(metas[1]).toHaveProperty('address', accounts.payer);
  expect(metas[0]).toHaveProperty('role');
  expect(Object.values(AccountRole)).toContain(metas[0].role);
});

test('getAddAuthorityV1BaseAccountMetas returns correct structure', () => {
  const accounts = {
    swig: 'Swig111111111111111111111111111111111111111' as any,
    payer: 'Payer1111111111111111111111111111111111111' as any,
  };
  const metas = getAddAuthorityV1BaseAccountMetas(accounts);
  expect(metas.length).toBe(3);
  expect(metas[0]).toHaveProperty('address', accounts.swig);
  expect(metas[1]).toHaveProperty('address', accounts.payer);
  expect(metas[0]).toHaveProperty('role');
  expect(Object.values(AccountRole)).toContain(metas[0].role);
});

// Dummy addresses for testing
const dummyAddress = (label: string) =>
  `${label}111111111111111111111111111111111111111` as Address;

describe('SwigInstructionV1', () => {
  it('create returns an IInstruction', () => {
    const accounts: CreateV1BaseAccountMetas = [
      { address: dummyAddress('swig'), role: AccountRole.WRITABLE },
      { address: dummyAddress('payer'), role: AccountRole.WRITABLE_SIGNER },
      { address: dummyAddress('system'), role: AccountRole.READONLY },
    ];
    const data = {
      authorityType: AuthorityType.Ed25519,
      authorityData: new Uint8Array([]),
      bump: 1,
      noOfActions: 0,
      id: new Uint8Array(32),
      actions: new Uint8Array([]),
    };
    const ix = SwigInstructionV1.create(accounts, data as any);
    expect(ix).toHaveProperty('keys');
    expect(ix).toHaveProperty('programAddress');
    expect(ix).toHaveProperty('data');
  });

  it('addAuthority returns an IInstruction', () => {
    const accounts = [
      { address: dummyAddress('swig'), role: AccountRole.WRITABLE },
      { address: dummyAddress('payer'), role: AccountRole.WRITABLE_SIGNER },
      { address: dummyAddress('system'), role: AccountRole.READONLY },
      { address: dummyAddress('authority'), role: AccountRole.WRITABLE_SIGNER },
    ] as [...CreateV1BaseAccountMetas, { address: Address; role: AccountRole }];
    const data = {
      actingRoleId: 0,
      newAuthorityType: AuthorityType.Ed25519,
      noOfActions: 0,
      newAuthorityData: new Uint8Array([]),
      actions: new Uint8Array([]),
      authorityPayload: new Uint8Array([]),
    };
    const ix = SwigInstructionV1.addAuthority(accounts, data as any);
    expect(ix).toHaveProperty('keys');
    expect(ix).toHaveProperty('programAddress');
    expect(ix).toHaveProperty('data');
  });

  it('removeAuthority returns an IInstruction', () => {
    const accounts: RemoveAuthorityV1BaseAccountMetas = [
      { address: dummyAddress('swig'), role: AccountRole.WRITABLE },
      { address: dummyAddress('payer'), role: AccountRole.WRITABLE_SIGNER },
      { address: dummyAddress('authority'), role: AccountRole.WRITABLE_SIGNER },
    ];
    const data = {
      actingRoleId: 0,
      authorityToRemoveId: 0,
      authorityPayload: new Uint8Array([]),
    };
    const ix = SwigInstructionV1.removeAuthority(accounts, data as any);
    expect(ix).toHaveProperty('keys');
    expect(ix).toHaveProperty('programAddress');
    expect(ix).toHaveProperty('data');
  });

  it('sign returns an IInstruction', () => {
    const accounts: SignV1BaseAccountMetas = [
      { address: dummyAddress('swig'), role: AccountRole.WRITABLE },
      { address: dummyAddress('payer'), role: AccountRole.WRITABLE_SIGNER },
    ];
    const data = {
      roleId: 0,
      authorityPayload: new Uint8Array([]),
      compactInstructions: [],
    };
    const ix = SwigInstructionV1.sign(accounts, data as any);
    expect(ix).toHaveProperty('keys');
    expect(ix).toHaveProperty('programAddress');
    expect(ix).toHaveProperty('data');
  });

  it('createSession returns an IInstruction', () => {
    const accounts = [
      { address: dummyAddress('swig'), role: AccountRole.WRITABLE },
      { address: dummyAddress('payer'), role: AccountRole.WRITABLE_SIGNER },
      { address: dummyAddress('session'), role: AccountRole.READONLY },
    ] as [
      { address: Address; role: AccountRole },
      { address: Address; role: AccountRole },
      { address: Address; role: AccountRole },
    ];
    const data = {
      roleId: 0,
      sessionDuration: 0n,
      authorityPayload: new Uint8Array([]),
      sessionKey: new Uint8Array(32),
    };
    const ix = SwigInstructionV1.createSession(accounts, data as any);
    expect(ix).toHaveProperty('keys');
    expect(ix).toHaveProperty('programAddress');
    expect(ix).toHaveProperty('data');
  });

  it('subAccountCreate returns an IInstruction', () => {
    const accounts: SubAccountCreateV1BaseAccountMetas = [
      { address: dummyAddress('swig'), role: AccountRole.WRITABLE },
      { address: dummyAddress('payer'), role: AccountRole.WRITABLE_SIGNER },
      { address: dummyAddress('subaccount'), role: AccountRole.WRITABLE },
      { address: dummyAddress('system'), role: AccountRole.READONLY },
    ];
    const data = {
      subAccountId: new Uint8Array(32),
      authorityType: AuthorityType.Ed25519,
      authorityPayload: new Uint8Array([]),
      actions: new Uint8Array([]),
      noOfActions: 0,
      subAccountData: new Uint8Array([]),
    };
    const ix = SwigInstructionV1.subAccountCreate(accounts, data as any);
    expect(ix).toHaveProperty('keys');
    expect(ix).toHaveProperty('programAddress');
    expect(ix).toHaveProperty('data');
  });

  it('subAccountSign returns an IInstruction', () => {
    const accounts: SubAccountSignV1BaseAccountMetas = [
      { address: dummyAddress('swig'), role: AccountRole.READONLY },
      { address: dummyAddress('payer'), role: AccountRole.READONLY_SIGNER },
      { address: dummyAddress('subaccount'), role: AccountRole.WRITABLE },
      { address: dummyAddress('system'), role: AccountRole.READONLY },
    ];
    const data = {
      subAccountId: new Uint8Array(32),
      authorityPayload: new Uint8Array([]),
      compactInstructions: [],
    };
    const ix = SwigInstructionV1.subAccountSign(accounts, data as any);
    expect(ix).toHaveProperty('keys');
    expect(ix).toHaveProperty('programAddress');
    expect(ix).toHaveProperty('data');
  });

  it('subAccountWithdraw returns an IInstruction', () => {
    const accounts: SubAccountWithdrawV1BaseAccountMetas = [
      { address: dummyAddress('swig'), role: AccountRole.WRITABLE },
      { address: dummyAddress('payer'), role: AccountRole.WRITABLE_SIGNER },
      { address: dummyAddress('subaccount'), role: AccountRole.WRITABLE },
    ];
    const data = {
      subAccountId: new Uint8Array(32),
      authorityPayload: new Uint8Array([]),
      amount: 0n,
    };
    const ix = SwigInstructionV1.subAccountWithdraw(accounts, data as any);
    expect(ix).toHaveProperty('keys');
    expect(ix).toHaveProperty('programAddress');
    expect(ix).toHaveProperty('data');
  });

  it('subAccountToggle returns an IInstruction', () => {
    const accounts: SubAccountToggleV1BaseAccountMetas = [
      { address: dummyAddress('swig'), role: AccountRole.READONLY },
      { address: dummyAddress('payer'), role: AccountRole.READONLY_SIGNER },
      { address: dummyAddress('subaccount'), role: AccountRole.WRITABLE },
    ];
    const data = {
      subAccountId: new Uint8Array(32),
      authorityPayload: new Uint8Array([]),
      enabled: true,
    };
    const ix = SwigInstructionV1.subAccountToggle(accounts, data as any);
    expect(ix).toHaveProperty('keys');
    expect(ix).toHaveProperty('programAddress');
    expect(ix).toHaveProperty('data');
  });
});
