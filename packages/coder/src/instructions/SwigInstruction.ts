import {
  containsBytes,
  getU16Decoder,
  getU16Encoder,
  type Decoder,
  type Encoder,
  type ReadonlyUint8Array,
} from '@solana/kit';

export enum SwigInstructionDiscriminator {
  CreateV1,
  AddAuthorityV1,
  RemoveAuthorityV1,
  // ReplaceAuthorityV1,
  SignV1 = 4,
  CreateSessionV1,
}

export function getSwigInstructionDiscriminatorEncoder(): Encoder<SwigInstructionDiscriminator> {
  return getU16Encoder();
}

export function getSwigInstructionDiscriminatorDecoder(): Decoder<SwigInstructionDiscriminator> {
  return getU16Decoder();
}

export function identifySwigInstruction(
  instruction: { data: ReadonlyUint8Array } | ReadonlyUint8Array,
): SwigInstructionDiscriminator {
  const data = 'data' in instruction ? instruction.data : instruction;
  let discriminatorEncoder = getSwigInstructionDiscriminatorEncoder();
  if (containsBytes(data, discriminatorEncoder.encode(0), 0)) {
    return SwigInstructionDiscriminator.CreateV1;
  }
  if (containsBytes(data, discriminatorEncoder.encode(1), 0)) {
    return SwigInstructionDiscriminator.AddAuthorityV1;
  }
  if (containsBytes(data, discriminatorEncoder.encode(2), 0)) {
    return SwigInstructionDiscriminator.RemoveAuthorityV1;
  }
  // if (containsBytes(data, discriminatorEncoder.encode(3), 0)) {
  //   return SwigInstructionDiscriminator.ReplaceAuthorityV1;
  // }
  if (containsBytes(data, discriminatorEncoder.encode(4), 0)) {
    return SwigInstructionDiscriminator.SignV1;
  }
  if (containsBytes(data, discriminatorEncoder.encode(5), 0)) {
    return SwigInstructionDiscriminator.CreateSessionV1;
  }
  throw new Error(
    'The provided instruction could not be identified as a swig instruction.',
  );
}
