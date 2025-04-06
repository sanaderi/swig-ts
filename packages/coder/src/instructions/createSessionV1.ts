// import {
//   combineCodec,
//   fixDecoderSize,
//   fixEncoderSize,
//   getBytesDecoder,
//   getBytesEncoder,
//   getStructDecoder,
//   getStructEncoder,
//   getU16Decoder,
//   getU16Encoder,
//   getU64Decoder,
//   getU64Encoder,
//   getU8Decoder,
//   getU8Encoder,
//   transformEncoder,
//   type Codec,
//   type Decoder,
//   type Encoder,
//   type ReadonlyUint8Array,
// } from '@solana/kit';
// import { AuthorityType } from '../types';
// import { SwigInstructionDiscriminator as Discriminator } from './SwigInstruction';

// export type CreateSessionV1InstructionData = {
//   discriminator: number;
//   roleId: number;
//   _padding: ReadonlyUint8Array;
//   authorityPayloadLen: AuthorityType;
//   sessionDuration: bigint;
//   authorityPayload: ReadonlyUint8Array;
//   sessionKey: ReadonlyUint8Array;
// };

// export type CreateSessionV1InstructionDataArgs = {
//   roleId: number;
//   sessionDuration: bigint;
//   authorityPayload: ReadonlyUint8Array;
//   sessionKey: ReadonlyUint8Array;
// };

// export function getCreateSessionV1InstructionCodec(payloadSize: number): {
//   encoder: Encoder<CreateSessionV1InstructionDataArgs>;
//   decoder: Decoder<CreateSessionV1InstructionData>;
//   codec: Codec<
//     CreateSessionV1InstructionDataArgs,
//     CreateSessionV1InstructionData
//   >;
// } {
//   let encoder: Encoder<CreateSessionV1InstructionDataArgs> = transformEncoder(
//     getStructEncoder([
//       ['discriminator', getU8Encoder()],
//       ['roleId', getU8Encoder()],
//       ['_padding', fixEncoderSize(getBytesEncoder(), 4)],
//       ['authorityPayloadLen', getU16Encoder()],
//       ['sessionDuration', getU64Encoder()],
//       ['authorityPayload', fixEncoderSize(getBytesEncoder(), payloadSize)],
//       ['sessionKey', fixEncoderSize(getBytesEncoder(), 32)],
//     ]),
//     (value) => ({
//       ...value,
//       discriminator: Discriminator.CreateSessionV1,
//       _padding: Uint8Array.from(Array(4).fill(0)),
//       authorityPayloadLen: value.authorityPayload.length,
//     }),
//   );

//   let decoder: Decoder<CreateSessionV1InstructionData> = getStructDecoder([
//     ['discriminator', getU8Decoder()],
//     ['roleId', getU8Decoder()],
//     ['_padding', fixDecoderSize(getBytesDecoder(), 4)],
//     ['authorityPayloadLen', getU16Decoder()],
//     ['sessionDuration', getU64Decoder()],
//     ['authorityPayload', fixDecoderSize(getBytesDecoder(), payloadSize)],
//     ['sessionKey', fixDecoderSize(getBytesDecoder(), 32)],
//   ]);

//   let codec: Codec<
//     CreateSessionV1InstructionDataArgs,
//     CreateSessionV1InstructionData
//   > = combineCodec(encoder, decoder);

//   return { encoder, decoder, codec };
// }
