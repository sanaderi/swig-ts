import {
  fixDecoderSize,
  fixEncoderSize,
  getBytesDecoder,
  getBytesEncoder,
  getStructDecoder,
  getStructEncoder,
  getU64Decoder,
  getU64Encoder,
  type Decoder,
  type Encoder,
  type ReadonlyUint8Array,
} from '@solana/kit';

export type Secp256k1SessionAuthorityData = {
  publicKey: ReadonlyUint8Array;
  _padding: ReadonlyUint8Array;
  sigFilter: ReadonlyUint8Array;
  sessionKey: ReadonlyUint8Array;
  maxSessionLength: bigint;
  currentSessionExpiration: bigint;
};

export function getSecp256k1SessionEncoder(): Encoder<Secp256k1SessionAuthorityData> {
  return getStructEncoder([
    ['publicKey', fixEncoderSize(getBytesEncoder(), 33)],
    ['_padding', fixEncoderSize(getBytesEncoder(), 7)],
    ['sigFilter', fixEncoderSize(getBytesEncoder(), 32)],
    ['sessionKey', fixEncoderSize(getBytesEncoder(), 32)],
    ['maxSessionLength', getU64Encoder()],
    ['currentSessionExpiration', getU64Encoder()],
  ]);
}

export function getSecp256k1SessionDecoder(): Decoder<Secp256k1SessionAuthorityData> {
  return getStructDecoder([
    ['publicKey', fixDecoderSize(getBytesDecoder(), 33)],
    ['_padding', fixDecoderSize(getBytesDecoder(), 7)],
    ['sigFilter', fixDecoderSize(getBytesDecoder(), 152)],
    ['sessionKey', fixDecoderSize(getBytesDecoder(), 32)],
    ['maxSessionLength', getU64Decoder()],
    ['currentSessionExpiration', getU64Decoder()],
  ]);
}
