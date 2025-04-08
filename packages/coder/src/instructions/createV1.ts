import {
  combineCodec,
  fixDecoderSize,
  fixEncoderSize,
  getBytesDecoder,
  getBytesEncoder,
  getStructDecoder,
  getStructEncoder,
  getU16Decoder,
  getU16Encoder,
  getU8Decoder,
  getU8Encoder,
  transformEncoder,
  type Codec,
  type Decoder,
  type Encoder,
  type ReadonlyUint8Array,
} from '@solana/kit';
import {
  AuthorityType,
  getAuthorityTypeDecoder,
  getAuthorityTypeEncoder,
} from '../types';
import { SwigInstructionDiscriminator as Discriminator } from './SwigInstruction';

export type CreateV1InstructionData = {
  discriminator: number;
  id: ReadonlyUint8Array;
  bump: number;
  noOfActions: number;
  _padding: ReadonlyUint8Array;
  authorityType: AuthorityType;
  authorityDataLen: number;
  authorityData: ReadonlyUint8Array;
  actions: ReadonlyUint8Array;
};

export type CreateV1InstructionDataArgs = {
  id: ReadonlyUint8Array;
  bump: number;
  /**
   * no of actions to add to the role
   */
  noOfActions: number;
  authorityType: AuthorityType;
  authorityData: ReadonlyUint8Array;
  actions: ReadonlyUint8Array;
};

export function getCreateV1InstructionDataCodec() {
  let encoder: Encoder<CreateV1InstructionDataArgs> = transformEncoder(
    getStructEncoder([
      ['discriminator', getU8Encoder()],
      ['id', fixEncoderSize(getBytesEncoder(), 32)],
      ['bump', getU8Encoder()],
      ['noOfActions', getU8Encoder()],
      ['_padding', fixEncoderSize(getBytesEncoder(), 1)],
      ['authorityType', getAuthorityTypeEncoder()],
      ['authorityDataLen', getU16Encoder()],
      ['authorityData', getBytesEncoder()],
      ['actions', getBytesEncoder()],
    ]),
    (value) => ({
      ...value,
      discriminator: Discriminator.CreateV1,
      _padding: Uint8Array.from(Array(1).fill(0)),
      authorityDataLen: value.authorityData.length,
    }),
  );

  let decoder: Decoder<CreateV1InstructionData> = getStructDecoder([
    ['discriminator', getU8Decoder()],
    ['id', fixDecoderSize(getBytesDecoder(), 32)],
    ['bump', getU8Decoder()],
    ['noOfActions', getU8Decoder()],
    ['_padding', fixDecoderSize(getBytesDecoder(), 1)],
    ['authorityType', getAuthorityTypeDecoder()],
    ['authorityDataLen', getU16Decoder()],
    ['authorityData', getBytesDecoder()],
    ['actions', getBytesDecoder()],
  ]);

  let codec: Codec<CreateV1InstructionDataArgs, CreateV1InstructionData> =
    combineCodec(encoder, decoder);

  return { encoder, decoder, codec };
}
