import {
  Connection,
  PublicKey,
  type Commitment,
  type GetAccountInfoConfig,
} from '@solana/web3.js';
import { getSwigCodec, type SwigAccount } from '@swig/coder';
import { fetchMaybeSwigAccount, fetchSwigAccount } from '../accounts';
import { type Actions } from '../actions';
import { Authority } from '../authority';
import { deserializeRoles, type SessionBasedRole } from '../role';

export class Swig {
  private constructor(
    public readonly address: PublicKey,
    private account: SwigAccount,
  ) {}

  get id() {
    return this.account.id;
  }

  get roles() {
    return deserializeRoles(
      this.address,
      Uint8Array.from(this.account.roles_buffer),
      this.account.roles,
    );
  }

  findRoleBySessionKey(sessionKey: PublicKey): SessionBasedRole | null {
    let role = this.roles.find(
      (r) =>
        r.isSessionBased() &&
        r.authority.sessionKey.toBase58() === sessionKey.toBase58(),
    );
    if (!role) return null;
    return role as SessionBasedRole;
  }

  static async fetchNullable(
    connection: Connection,
    swigAddress: PublicKey,
    config?: Commitment | GetAccountInfoConfig,
  ): Promise<Swig | null> {
    let maybeSwig = await fetchMaybeSwigAccount(
      connection,
      swigAddress,
      config,
    );
    if (!maybeSwig) {
      return null;
    }
    return new Swig(swigAddress, maybeSwig);
  }

  static async fetch(
    connection: Connection,
    swigAddress: PublicKey,
    config?: Commitment | GetAccountInfoConfig,
  ): Promise<Swig> {
    let swig = await fetchSwigAccount(connection, swigAddress, config);

    return new Swig(swigAddress, swig);
  }

  async refetch(
    connection: Connection,
    config?: Commitment | GetAccountInfoConfig,
  ) {
    let swig = await fetchSwigAccount(connection, this.address, config);
    this.account = swig;
  }

  static fromRawAccountData(swigAddress: PublicKey, accountData: Uint8Array) {
    let swigAccount = getSwigCodec().decode(accountData);
    return new Swig(swigAddress, swigAccount);
  }

  static create(args: {
    payer: PublicKey;
    id: Uint8Array;
    actions: Actions;
    authority: Authority;
  }) {
    return args.authority.create({
      payer: args.payer,
      id: args.id,
      actions: args.actions,
    });
  }

  findRoleByAuthority(authority: Authority) {
    return this.roles.find((role) => role.authority.isEqual(authority)) ?? null;
  }

  findRoleById(id: number) {
    return this.roles.find((role) => role.id === id) ?? null;
  }

  findRolesByAuthoritySigner(signer: Uint8Array) {
    return this.roles.filter((role) => role.authority.matchesSigner(signer));
  }
}
