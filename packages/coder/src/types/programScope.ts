import {
  fixDecoderSize,
  fixEncoderSize,
  getBytesDecoder,
  getBytesEncoder,
  getEnumDecoder,
  getEnumEncoder,
  getStructDecoder,
  getStructEncoder,
  getU128Decoder,
  getU128Encoder,
  getU64Decoder,
  getU64Encoder,
  getU8Decoder,
  getU8Encoder,
  transformEncoder,
  type Decoder,
  type Encoder,
  type ReadonlyUint8Array,
} from '@solana/kit';

export type ProgramScope = {
  currentAmount: bigint;
  limit: bigint;
  window: bigint;
  lastReset: bigint;
  programId: ReadonlyUint8Array;
  targetAccount: ReadonlyUint8Array;
  scopeType: ProgramScopeType;
  numericType: NumericType;
  // _padding: ReadonlyUint8Array;
};

export function getProgramScopeEncoder(): Encoder<ProgramScope> {
  return transformEncoder(
    getStructEncoder([
      ['currentAmount', getU128Encoder()],
      ['limit', getU128Encoder()],
      ['window', getU64Encoder()],
      ['lastReset', getU64Encoder()],
      ['programId', fixEncoderSize(getBytesEncoder(), 32)],
      ['targetAccount', fixEncoderSize(getBytesEncoder(), 32)],
      ['scopeType', getProgramScopeTypeEncoder()],
      ['numericType', getNumericTypeEncoder()],
      ['_padding', fixEncoderSize(getBytesEncoder(), 14)],
    ]),
    (value) => ({ ...value, _padding: new Uint8Array(14) }),
  );
}

export function getProgramScopeDecoder(): Decoder<ProgramScope> {
  return getStructDecoder([
    ['currentAmount', getU128Decoder()],
    ['limit', getU128Decoder()],
    ['window', getU64Decoder()],
    ['lastReset', getU64Decoder()],
    ['programId', fixDecoderSize(getBytesDecoder(), 32)],
    ['targetAccount', fixDecoderSize(getBytesDecoder(), 32)],
    ['scopeType', getProgramScopeTypeDecoder()],
    ['numericType', getNumericTypeDecoder()],
    ['_padding', fixDecoderSize(getBytesDecoder(), 14)],
  ]);
}

export enum ProgramScopeType {
  Basic,
  Limit,
  RecurringLimit,
}

export enum NumericType {
  U8,
  U32,
  U64,
  U128,
}

export function getProgramScopeTypeEncoder(): Encoder<ProgramScopeType> {
  return getEnumEncoder(ProgramScopeType);
}

export function getProgramScopeTypeDecoder(): Decoder<ProgramScopeType> {
  return getEnumDecoder(ProgramScopeType);
}


export function getNumericTypeEncoder(): Encoder<NumericType> {
  return getEnumEncoder(NumericType);
}

export function getNumericTypeDecoder(): Decoder<NumericType> {
  return getEnumDecoder(NumericType);
}

