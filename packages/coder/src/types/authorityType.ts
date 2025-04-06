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

export enum AuthorityType {
  // None,
  Ed25519 = 1,
  Ed25519Session,
  Secp256k1,
  // Secp256k1Session,
  // Secp256r1Session,
  // R1PasskeySession,
}

export function getAuthorityTypeEncoder(): Encoder<AuthorityType> {
  return getEnumEncoder(AuthorityType, { size: getU16Encoder() });
}

export function getAuthorityTypeDecoder(): Decoder<AuthorityType> {
  return getEnumDecoder(AuthorityType, { size: getU16Decoder() });
}

export function getAuthorityTypeCodec(): Codec<AuthorityType, AuthorityType> {
  return combineCodec(getAuthorityTypeEncoder(), getAuthorityTypeDecoder());
}
