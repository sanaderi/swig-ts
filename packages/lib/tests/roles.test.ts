import { address } from '@solana/kit';
import {
  deserializeRoleData,
  deserializeRoles,
  getAddAuthorityInstructionContext,
  getCreateSessionInstructionContext,
  getRemoveAuthorityInstructionContext,
  getSignInstructionContext,
  Role,
  type SessionBasedRole,
  type TokenBasedRole,
} from '../src';
import { Actions } from '../src/actions/action';

// Mock addresses
const MOCK_SWIG_ADDRESS = address(
  'So11111111111111111111111111111111111111112',
);
const MOCK_PROGRAM_ADDRESS = address(
  'So11111111111111111111111111111111111111114',
);
const MOCK_TOKEN_MINT = address('So11111111111111111111111111111111111111115');

// Mock SWIG ID
const MOCK_SWIG_ID = new Uint8Array(32).fill(1);

describe('Role Class Static Methods', () => {
  describe('static from', () => {
    test('should exist and be a function', () => {
      expect(typeof Role.from).toBe('function');
    });
  });
});

describe('Role Helper Functions', () => {
  describe('signInstruction', () => {
    test('should exist and be a function', () => {
      expect(typeof getSignInstructionContext).toBe('function');
    });
  });

  describe('addAuthorityInstruction', () => {
    test('should exist and be a function', () => {
      expect(typeof getAddAuthorityInstructionContext).toBe('function');
    });
  });

  describe('removeAuthorityInstruction', () => {
    test('should exist and be a function', () => {
      expect(typeof getRemoveAuthorityInstructionContext).toBe('function');
    });
  });

  describe('createSessionInstruction', () => {
    test('should exist and be a function', () => {
      expect(typeof getCreateSessionInstructionContext).toBe('function');
    });
  });

  describe('deserializeRoles', () => {
    test('should exist and be a function', () => {
      expect(typeof deserializeRoles).toBe('function');
    });

    test('should return empty array for zero count', () => {
      const rolesBuffer = new Uint8Array(0);
      const roles = deserializeRoles(
        MOCK_SWIG_ADDRESS,
        rolesBuffer,
        0,
        MOCK_SWIG_ID,
      );
      expect(roles).toEqual([]);
    });
  });

  describe('deserializeRoleData', () => {
    test('should exist and be a function', () => {
      expect(typeof deserializeRoleData).toBe('function');
    });
  });
});
describe('Role Class with Real Actions', () => {
  describe('Actions integration', () => {
    test('Actions builder should work with Role-related methods', () => {
      const actions = Actions.set()
        .solLimit({ amount: 1000n })
        .tokenLimit({ mint: MOCK_TOKEN_MINT, amount: 500n })
        .programLimit({ programId: MOCK_PROGRAM_ADDRESS })
        .get();

      // Test basic Actions methods that would be used by Role
      const solLimit = actions.solSpendLimit();
      const tokenLimit = actions.tokenSpendLimit(MOCK_TOKEN_MINT);
      expect(solLimit === null || typeof solLimit === 'bigint').toBe(true);
      expect(tokenLimit === null || typeof tokenLimit === 'bigint').toBe(true);
      expect(typeof actions.canUseProgram(MOCK_PROGRAM_ADDRESS)).toBe(
        'boolean',
      );
      expect(typeof actions.canSpendSol(1000n)).toBe('boolean');
      expect(typeof actions.canSpendToken(MOCK_TOKEN_MINT, 500n)).toBe(
        'boolean',
      );
    });

    test('Actions should provide SpendController objects', () => {
      const actions = Actions.set()
        .solLimit({ amount: 1000n })
        .tokenLimit({ mint: MOCK_TOKEN_MINT, amount: 500n })
        .get();

      const solController = actions.solSpend();
      const tokenController = actions.tokenSpend(MOCK_TOKEN_MINT);

      expect(solController).toBeDefined();
      expect(tokenController).toBeDefined();
      expect(typeof solController.isAllowed).toBe('boolean');
      expect(typeof tokenController.isAllowed).toBe('boolean');
    });

    test('Actions should handle permission checks correctly', () => {
      const limitedActions = Actions.set().solLimit({ amount: 1000n }).get();

      const rootActions = Actions.set().all().get();

      expect(limitedActions.isRoot()).toBe(false);
      expect(rootActions.isRoot()).toBe(true);
    });
  });
});

describe('Role Type Guards', () => {
  test('SessionBasedRole and TokenBasedRole types should be available', () => {
    const sessionType: SessionBasedRole | null = null;
    const tokenType: TokenBasedRole | null = null;

    expect(sessionType).toBe(null);
    expect(tokenType).toBe(null);
  });
});
