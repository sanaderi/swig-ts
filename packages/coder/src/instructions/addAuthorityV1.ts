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
  getU32Decoder,
  getU32Encoder,
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

export type AddAuthorityV1InstructionData = {
  discriminator: number;
  actingRoleId: number;
  _padding1: ReadonlyUint8Array; // 3
  newAuthorityDataLen: number;
  actionsPayloadLen: number;
  newAuthorityType: AuthorityType;
  noOfActions: number;
  _padding2: ReadonlyUint8Array; // 1
  newAuthorityData: ReadonlyUint8Array;
  actions: ReadonlyUint8Array;
  authorityPayload: ReadonlyUint8Array;
};

export type AddAuthorityV1InstructionDataArgs = {
  actingRoleId: number;
  newAuthorityType: AuthorityType;
  noOfActions: number;
  newAuthorityData: ReadonlyUint8Array;
  actions: ReadonlyUint8Array;
  authorityPayload: ReadonlyUint8Array;
};

export function getAddAuthorityV1InstructionCodec(
  payloadSize: number,
  newAuthorityDataSize: number,
): {
  encoder: Encoder<AddAuthorityV1InstructionDataArgs>;
  decoder: Decoder<AddAuthorityV1InstructionData>;
  codec: Codec<
    AddAuthorityV1InstructionDataArgs,
    AddAuthorityV1InstructionData
  >;
} {
  // let actionsEncoder = getArrayEncoder(getActionEncoder());

  let encoder: Encoder<AddAuthorityV1InstructionDataArgs> = transformEncoder(
    getStructEncoder([
      ['discriminator', getU8Encoder()],
      ['actingRoleId', getU32Encoder()],
      ['_padding1', fixEncoderSize(getBytesEncoder(), 3)],
      ['newAuthorityDataLen', getU16Encoder()],
      ['actionsPayloadLen', getU16Encoder()],
      ['newAuthorityType', getAuthorityTypeEncoder()],
      ['noOfActions', getU8Encoder()],
      ['_padding2', fixEncoderSize(getBytesEncoder(), 1)],
      [
        'newAuthorityData',
        fixEncoderSize(getBytesEncoder(), newAuthorityDataSize),
      ],
      ['actions', getBytesEncoder()],
      ['authorityPayload', fixEncoderSize(getBytesEncoder(), payloadSize)],
    ]),
    (value) => ({
      ...value,
      discriminator: Discriminator.AddAuthorityV1,
      actionsPayloadLen: value.actions.length,
      newAuthorityDataLen: newAuthorityDataSize,
      _padding1: Uint8Array.from(Array(3)),
      _padding2: Uint8Array.from(Array(1))
    }),
  );

  let decoder: Decoder<AddAuthorityV1InstructionData> = getStructDecoder([
    ['discriminator', getU8Decoder()],
    ['actingRoleId', getU32Decoder()],
    ['_padding1', fixDecoderSize(getBytesDecoder(), 3)],
    ['newAuthorityDataLen', getU16Decoder()],
    ['actionsPayloadLen', getU16Decoder()],
    ['newAuthorityType', getAuthorityTypeDecoder()],
    ['noOfActions', getU8Decoder()],
    ['_padding2', fixDecoderSize(getBytesDecoder(), 1)],
    [
      'newAuthorityData',
      fixDecoderSize(getBytesDecoder(), newAuthorityDataSize),
    ],
    ['actions', getBytesDecoder()],
    ['authorityPayload', fixDecoderSize(getBytesDecoder(), payloadSize)],
  ]);

  let codec: Codec<
    AddAuthorityV1InstructionDataArgs,
    AddAuthorityV1InstructionData
  > = combineCodec(encoder, decoder);

  return { encoder, decoder, codec };
}
