import { Swig } from '../src/swig';

describe('Swig Class', () => {
  describe('static fromRawAccountData', () => {
    test('should have fromRawAccountData method', () => {
      expect(typeof Swig.fromRawAccountData).toBe('function');
    });
  });

  describe('instance methods', () => {
    test('should have findRoleBySessionKey method', () => {
      expect(Swig.prototype.findRoleBySessionKey).toBeDefined();
      expect(typeof Swig.prototype.findRoleBySessionKey).toBe('function');
    });

    test('should have findRoleById method', () => {
      expect(Swig.prototype.findRoleById).toBeDefined();
      expect(typeof Swig.prototype.findRoleById).toBe('function');
    });

    test('should have findRolesByAuthoritySigner method', () => {
      expect(Swig.prototype.findRolesByAuthoritySigner).toBeDefined();
      expect(typeof Swig.prototype.findRolesByAuthoritySigner).toBe('function');
    });

    test('should have findRolesByEd25519SignerPk method', () => {
      expect(Swig.prototype.findRolesByEd25519SignerPk).toBeDefined();
      expect(typeof Swig.prototype.findRolesByEd25519SignerPk).toBe('function');
    });

    test('should have findRolesBySecp256k1SignerAddress method', () => {
      expect(Swig.prototype.findRolesBySecp256k1SignerAddress).toBeDefined();
      expect(typeof Swig.prototype.findRolesBySecp256k1SignerAddress).toBe(
        'function',
      );
    });

    test('should have refetch method', () => {
      expect(Swig.prototype.refetch).toBeDefined();
      expect(typeof Swig.prototype.refetch).toBe('function');
    });
  });

  describe('properties', () => {
    test('should have id getter defined', () => {
      const descriptor = Object.getOwnPropertyDescriptor(Swig.prototype, 'id');
      expect(descriptor).toBeDefined();
      expect(descriptor?.get).toBeDefined();
    });

    test('should have roles getter defined', () => {
      const descriptor = Object.getOwnPropertyDescriptor(
        Swig.prototype,
        'roles',
      );
      expect(descriptor).toBeDefined();
      expect(descriptor?.get).toBeDefined();
    });
  });
});
