import {
  combineCodec,
  getEnumDecoder,
  getEnumEncoder,
  getU16Decoder,
  getU16Encoder,
  getUnitDecoder,
  type Codec,
  type Decoder,
  type Encoder,
} from '@solana/kit';

export enum Permission {
  SolLimit = 1,
  SolRecurringLimit,
  Program,
  TokenLimit,
  TokenRecurringLimit,
  All,
  ManageAuthority,
  SubAccount,
}

export function getPermissionEncoder(): Encoder<Permission> {
  return getEnumEncoder(Permission, { size: getU16Encoder() });
}

export function getPermissionDecoder(): Decoder<Permission> {
  return getEnumDecoder(Permission, { size: getU16Decoder() });
}

export function getPermissionCodec(): Codec<Permission, Permission> {
  return combineCodec(getPermissionEncoder(), getPermissionDecoder());
}


export type All = void

export type ManageAuthority = void

// export function getAllDecoder(): Decoder<All> {
//   return getUnitDecoder()
// }

// export function getManageAuthorityDecoder(): Decoder<ManageAuthority> {
//   return getUnitDecoder()
// }

