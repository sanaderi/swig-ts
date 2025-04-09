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
import {
  SwigInstructionDiscriminator as Discriminator,
  getSwigInstructionDiscriminatorDecoder,
  getSwigInstructionDiscriminatorEncoder,
} from './SwigInstruction';

export type AddAuthorityV1InstructionData = {
  discriminator: number;
  newAuthorityDataLen: number;
  actionsPayloadLen: number;
  newAuthorityType: AuthorityType;
  noOfActions: number;
  _padding: ReadonlyUint8Array; // 3
  actingRoleId: number;
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
      ['discriminator', getSwigInstructionDiscriminatorEncoder()],
      ['newAuthorityDataLen', getU16Encoder()],
      ['actionsPayloadLen', getU16Encoder()],
      ['newAuthorityType', getAuthorityTypeEncoder()],
      ['noOfActions', getU8Encoder()],
      ['_padding', fixEncoderSize(getBytesEncoder(), 3)],
      ['actingRoleId', getU32Encoder()],
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
      _padding: Uint8Array.from(Array(3)),
    }),
  );

  let decoder: Decoder<AddAuthorityV1InstructionData> = getStructDecoder([
    ['discriminator', getSwigInstructionDiscriminatorDecoder()],
    ['newAuthorityDataLen', getU16Decoder()],
    ['actionsPayloadLen', getU16Decoder()],
    ['newAuthorityType', getAuthorityTypeDecoder()],
    ['noOfActions', getU8Decoder()],
    ['_padding', fixDecoderSize(getBytesDecoder(), 3)],
    ['actingRoleId', getU32Decoder()],
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
