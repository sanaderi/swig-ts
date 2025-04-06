import {
  combineCodec,
  getEnumDecoder,
  getEnumEncoder,
  getU16Decoder,
  getU16Encoder,
  type Codec,
  type Decoder,
  type Encoder,
} from '@solana/kit';

export enum Permission {
  None,
  SolLimit,
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
