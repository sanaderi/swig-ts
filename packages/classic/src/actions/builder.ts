import {
  ACTION_HEADER_LENGTH,
  getActionHeaderEncoder,
  getProgramLimitEncoder,
  getSolLimitEncoder,
  getSolRecurringLimitEncoder,
  getSubAccountEncoder,
  getTokenLimitEncoder,
  getTokenRecurringLimitEncoder,
  Permission,
  type ActionHeader,
  type ProgramLimit,
  type SolLimit,
  type SolRecurringLimit,
  type SubAccount,
  type TokenLimit,
  type TokenRecurringLimit,
} from '@swig/coder';
import { Actions } from './action';

export type ActionsData = { bytes: Uint8Array; noOfActions: number };

export class ActionsBuilder {
  private _actionConfigs: ActionConfig[] = [];

  private constructor() {}

  static new() {
    return new ActionsBuilder();
  }

  get count() {
    return this._actionConfigs.length;
  }

  data(): ActionsData {
    let cursor = 0;
    let bytes = new Uint8Array(this.bufferLength());

    this._actionConfigs.forEach((config) => {
      let boundary = cursor + config.lengthWithHeader;
      bytes.set(config.encodeWithHeader(boundary), cursor);
      cursor = boundary;
    });

    return { bytes, noOfActions: this.count };
  }

  get() {
    let { bytes, noOfActions } = this.data();
    return Actions.from(bytes, noOfActions);
  }

  bufferLength() {
    return this._actionConfigs.reduce(
      (sum, curr) => sum + curr.lengthWithHeader,
      0,
    );
  }

  all(): this {
    this._actionConfigs.push(new AllConfig());
    return this;
  }

  manageAuthority(): this {
    this._actionConfigs.push(new ManageAuthorityConfig());
    return this;
  }

  programLimit(payload: ProgramLimit): this {
    this._actionConfigs.push(new ProgramLimitConfig(payload));
    return this;
  }

  subAccount(payload: SubAccount): this {
    this._actionConfigs.push(new SubAccountConfig(payload));
    return this;
  }

  solLimit(payload: SolLimit): this {
    this._actionConfigs.push(new SolLimitConfig(payload));
    return this;
  }

  solRecurringLimit(payload: SolRecurringLimit): this {
    this._actionConfigs.push(new SolReccuringLimitConfig(payload));
    return this;
  }

  tokenLimit(payload: TokenLimit): this {
    this._actionConfigs.push(new TokenLimitConfig(payload));
    return this;
  }

  tokenReccuringLimit(payload: TokenRecurringLimit): this {
    this._actionConfigs.push(new TokenReccuringLimitConfig(payload));
    return this;
  }
}

export abstract class ActionConfig {
  abstract length: number;
  abstract permission: Permission;

  abstract encode(): Uint8Array;

  get lengthWithHeader() {
    return ACTION_HEADER_LENGTH + this.length;
  }

  header(boundary: number): ActionHeader {
    return { permission: this.permission, length: this.length, boundary };
  }

  encodeWithHeader(boundary: number): Readonly<Uint8Array> {
    let data = this.encode();
    let header = getActionHeaderEncoder().encode(this.header(boundary));

    let bytes = new Uint8Array(this.lengthWithHeader);

    bytes.set(header);

    if (this.lengthWithHeader > ACTION_HEADER_LENGTH) {
      bytes.set(data, ACTION_HEADER_LENGTH);
    }

    return bytes;
  }
}

export class AllConfig extends ActionConfig {
  constructor() {
    super();
  }

  get length() {
    return 0;
  }

  get permission() {
    return Permission.All;
  }

  encode(): Uint8Array {
    return new Uint8Array(0);
  }
}

export class ManageAuthorityConfig extends ActionConfig {
  constructor() {
    super();
  }

  get length() {
    return 0;
  }

  get permission() {
    return Permission.ManageAuthority;
  }

  encode(): Uint8Array {
    return new Uint8Array(0);
  }
}

export class ProgramLimitConfig extends ActionConfig {
  constructor(private payload: ProgramLimit) {
    super();
  }

  get length() {
    return 32;
  }

  get permission() {
    return Permission.Program;
  }

  encode(): Uint8Array {
    return Uint8Array.from(getProgramLimitEncoder().encode(this.payload));
  }
}

export class SubAccountConfig extends ActionConfig {
  constructor(private payload: SubAccount) {
    super();
  }

  get length() {
    return 32;
  }

  get permission() {
    return Permission.SubAccount;
  }

  encode(): Uint8Array {
    return Uint8Array.from(getSubAccountEncoder().encode(this.payload));
  }
}

export class SolLimitConfig extends ActionConfig {
  constructor(private payload: SolLimit) {
    super();
  }

  get length() {
    return 8;
  }

  get permission() {
    return Permission.SolLimit;
  }

  encode(): Uint8Array {
    return Uint8Array.from(getSolLimitEncoder().encode(this.payload));
  }
}

export class SolReccuringLimitConfig extends ActionConfig {
  constructor(private payload: SolRecurringLimit) {
    super();
  }

  get length() {
    return 32;
  }

  get permission() {
    return Permission.SolRecurringLimit;
  }

  encode(): Uint8Array {
    return Uint8Array.from(getSolRecurringLimitEncoder().encode(this.payload));
  }
}

export class TokenLimitConfig extends ActionConfig {
  constructor(private payload: TokenLimit) {
    super();
  }

  get length() {
    return 40;
  }

  get permission() {
    return Permission.TokenLimit;
  }

  encode(): Uint8Array {
    return Uint8Array.from(getTokenLimitEncoder().encode(this.payload));
  }
}

export class TokenReccuringLimitConfig extends ActionConfig {
  constructor(private payload: TokenRecurringLimit) {
    super();
  }

  get length() {
    return 64;
  }

  get permission() {
    return Permission.TokenRecurringLimit;
  }

  encode(): Uint8Array {
    return Uint8Array.from(
      getTokenRecurringLimitEncoder().encode(this.payload),
    );
  }
}
