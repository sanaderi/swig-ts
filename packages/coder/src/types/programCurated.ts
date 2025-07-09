import {
  combineCodec,
  getStructDecoder,
  getStructEncoder,
  type Codec,
  type Decoder,
  type Encoder,
} from '@solana/kit';

/**
 * ProgramCurated permission type - allows signing for curated programs
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type ProgramCurated = {};

export function getProgramCuratedEncoder(): Encoder<ProgramCurated> {
  return getStructEncoder([]);
}

export function getProgramCuratedDecoder(): Decoder<ProgramCurated> {
  return getStructDecoder([]);
}

export function getProgramCuratedCodec(): Codec<
  ProgramCurated,
  ProgramCurated
> {
  return combineCodec(getProgramCuratedEncoder(), getProgramCuratedDecoder());
}
