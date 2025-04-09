import {
  combineCodec,
  fixDecoderSize,
  fixEncoderSize,
  getArrayDecoder,
  getArrayEncoder,
  getBytesDecoder,
  getBytesEncoder,
  getF32Decoder,
  getStructDecoder,
  getStructEncoder,
  getU16Decoder,
  getU16Encoder,
  getU32Decoder,
  getU32Encoder,
  getU8Encoder,
  transformEncoder,
  type Codec,
  type Decoder,
  type Encoder,
  type ReadonlyUint8Array,
} from '@solana/kit';
import {
  getCompactInstructionDecoder,
  getCompactInstructionEncoder,
  type CompactInstruction,
} from '../types/compactInstruction';
import {
  SwigInstructionDiscriminator as Discriminator,
  getSwigInstructionDiscriminatorDecoder,
  getSwigInstructionDiscriminatorEncoder,
} from './SwigInstruction';

export type SignV1InstructionData = {
  discriminator: number;
  instructionPayloadLen: number;
  roleId: number;
  authorityPayload: ReadonlyUint8Array;
  compactInstructions: CompactInstruction[];
};

export type SignV1InstructionDataArgs = {
  roleId: number;
  authorityPayload: ReadonlyUint8Array;
  compactInstructions: CompactInstruction[];
};

export function getSignV1InstructionCodec(payloadSize: number): {
  encoder: Encoder<SignV1InstructionDataArgs>;
  decoder: Decoder<SignV1InstructionData>;
  codec: Codec<SignV1InstructionDataArgs, SignV1InstructionData>;
} {
  let encoder: Encoder<SignV1InstructionDataArgs> = transformEncoder(
    getStructEncoder([
      ['discriminator', getSwigInstructionDiscriminatorEncoder()],
      ['instructionPayloadLen', getU16Encoder()],
      ['roleId', getU32Encoder()],
      ['authorityPayload', fixEncoderSize(getBytesEncoder(), payloadSize)],
      [
        'compactInstructions',
        getArrayEncoder(getCompactInstructionEncoder(), {
          size: getU8Encoder(),
        }),
      ],
    ]),
    (value) => ({
      ...value,
      discriminator: Discriminator.SignV1,
      instructionPayloadLen: value.compactInstructions.length,
      authorityPayloadLen: payloadSize,
    }),
  );

  let decoder = getStructDecoder([
    ['discriminator', getSwigInstructionDiscriminatorDecoder()],
    ['instructionPayloadLen', getU16Decoder()],
    ['roleId', getF32Decoder()],
    ['authorityPayload', fixDecoderSize(getBytesDecoder(), payloadSize)],
    [
      'compactInstructions',
      getArrayDecoder(getCompactInstructionDecoder(), {
        size: getU32Decoder(),
      }),
    ],
  ]);

  let codec = combineCodec(encoder, decoder);

  return { encoder, decoder, codec };
}
