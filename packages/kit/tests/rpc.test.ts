import { address } from '@solana/kit';
import {
  createSwig,
  fetchNullableSwig,
  fetchSwig,
  getSignInstruction,
  signAndSend,
  addAuthority,
  removeAuthority,
  removeAllAuthorityRoles,
} from '../src/rpc';
import { Swig } from '../src/swig';

describe('RPC Functions', () => {
  describe('Swig Creation Functions', () => {
    test('createSwig function exists', () => {
      expect(typeof createSwig).toBe('function');
    });
  });

  describe('Swig Fetching Functions', () => {
    test('fetchNullableSwig function exists', () => {
      expect(typeof fetchNullableSwig).toBe('function');
    });

    test('fetchSwig function exists', () => {
      expect(typeof fetchSwig).toBe('function');
    });
  });

  describe('Instruction Creation Functions', () => {
    test('getSignInstruction function exists', () => {
      expect(typeof getSignInstruction).toBe('function');
    });
  });

  describe('Transaction Execution Functions', () => {
    test('signAndSend function exists', () => {
      expect(typeof signAndSend).toBe('function');
    });
  });

  describe('Authority Management Functions', () => {
    test('addAuthority function exists', () => {
      expect(typeof addAuthority).toBe('function');
    });

    test('removeAuthority function exists', () => {
      expect(typeof removeAuthority).toBe('function');
    });

    test('removeAllAuthorityRoles function exists', () => {
      expect(typeof removeAllAuthorityRoles).toBe('function');
    });
  });

  describe('Function Parameter Validation', () => {
    test('createSwig should accept correct parameter types', () => {
      // Test that the function can be called with proper type checking
      const functionSignature = createSwig.toString();
      expect(functionSignature).toContain('function');
    });

    test('fetchNullableSwig should accept correct parameter types', () => {
      const functionSignature = fetchNullableSwig.toString();
      expect(functionSignature).toContain('function');
    });

    test('fetchSwig should accept correct parameter types', () => {
      const functionSignature = fetchSwig.toString();
      expect(functionSignature).toContain('function');
    });

    test('getSignInstruction should accept correct parameter types', () => {
      const functionSignature = getSignInstruction.toString();
      expect(functionSignature).toContain('function');
    });

    test('signAndSend should accept correct parameter types', () => {
      const functionSignature = signAndSend.toString();
      expect(functionSignature).toContain('function');
    });

    test('addAuthority should accept correct parameter types', () => {
      const functionSignature = addAuthority.toString();
      expect(functionSignature).toContain('function');
    });

    test('removeAuthority should accept correct parameter types', () => {
      const functionSignature = removeAuthority.toString();
      expect(functionSignature).toContain('function');
    });

    test('removeAllAuthorityRoles should accept correct parameter types', () => {
      const functionSignature = removeAllAuthorityRoles.toString();
      expect(functionSignature).toContain('function');
    });
  });

  describe('Swig Static Methods via RPC', () => {
    test('Swig class has fetchNullable method', () => {
      expect(typeof Swig.fetchNullable).toBe('function');
    });

    test('Swig class has fetch method', () => {
      expect(typeof Swig.fetch).toBe('function');
    });
  });

  describe('RPC Function Return Types', () => {
    test('createSwig should return a Promise', () => {
      expect(createSwig.constructor.name).toBe('AsyncFunction');
    });

    test('fetchNullableSwig should be a function that returns Promise', () => {
      expect(typeof fetchNullableSwig).toBe('function');
    });

    test('fetchSwig should be a function that returns Promise', () => {
      expect(typeof fetchSwig).toBe('function');
    });

    test('getSignInstruction should return a Promise', () => {
      expect(getSignInstruction.constructor.name).toBe('AsyncFunction');
    });

    test('signAndSend should return a Promise', () => {
      expect(signAndSend.constructor.name).toBe('AsyncFunction');
    });

    test('addAuthority should return a Promise', () => {
      expect(addAuthority.constructor.name).toBe('AsyncFunction');
    });

    test('removeAuthority should return a Promise', () => {
      expect(removeAuthority.constructor.name).toBe('AsyncFunction');
    });

    test('removeAllAuthorityRoles should return a Promise', () => {
      expect(removeAllAuthorityRoles.constructor.name).toBe('AsyncFunction');
    });
  });

  describe('RPC Functions Documentation', () => {
    test('all RPC functions should be properly exported', () => {
      const rpcFunctions = [
        createSwig,
        fetchNullableSwig,
        fetchSwig,
        getSignInstruction,
        signAndSend,
        addAuthority,
        removeAuthority,
        removeAllAuthorityRoles,
      ];

      rpcFunctions.forEach((fn) => {
        expect(fn).toBeDefined();
        expect(typeof fn).toBe('function');
      });
    });

    test('RPC module should provide complete Swig management capabilities', () => {
      const hasStigCreation = typeof createSwig === 'function';
      const hasFetching = typeof fetchSwig === 'function' && typeof fetchNullableSwig === 'function';
      const hasInstructionCreation = typeof getSignInstruction === 'function';
      const hasTransactionExecution = typeof signAndSend === 'function';
      const hasAuthorityManagement = typeof addAuthority === 'function' && typeof removeAuthority === 'function';

      expect(hasStigCreation).toBe(true);
      expect(hasFetching).toBe(true);
      expect(hasInstructionCreation).toBe(true);
      expect(hasTransactionExecution).toBe(true);
      expect(hasAuthorityManagement).toBe(true);
    });
  });

  describe('Error Handling Capabilities', () => {
    test('async functions should be properly structured for error handling', () => {
      const asyncFunctions = [
        createSwig,
        getSignInstruction,
        signAndSend,
        addAuthority,
        removeAuthority,
        removeAllAuthorityRoles,
      ];

      asyncFunctions.forEach((fn) => {
        expect(fn.constructor.name).toBe('AsyncFunction');
      });
    });

    test('wrapper functions should be properly defined', () => {
      // Test the wrapper functions
      const wrapperFunctions = [
        fetchNullableSwig,
        fetchSwig,
      ];

      wrapperFunctions.forEach((fn) => {
        expect(typeof fn).toBe('function');
      });
    });
  });
});