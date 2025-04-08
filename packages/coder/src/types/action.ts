import type { Permission } from "./permissions";

export type ActionKind = Action['__kind'];

export type Action =
  | { __kind: Permission.All }
  | { __kind: Permission.ManageAuthority }
  | { __kind: Permission.Program }
  | { __kind: Permission.SolLimit }
  | { __kind: Permission.SolRecurringLimit }
  | { __kind: Permission.SubAccount }
  | { __kind: Permission.TokenLimit }
  | { __kind: Permission.TokenRecurringLimit }
  // | { __kind: 'Tokens'; action: TokenAction }
  // | { __kind: 'Token'; key: ReadonlyUint8Array; action: TokenAction }
  // | { __kind: 'Sol'; action: SolAction }
  // | { __kind: 'Program'; key: ReadonlyUint8Array };
