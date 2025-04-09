import { AuthorityType } from "@swig/coder";
import type { Authority } from "./abstract";
import { Ed25519Authority, Ed25519SessionAuthority } from "./ed25519";
import { Secp256k1Authority } from "./secp256k1";

export function getAuthority(type: AuthorityType, data: Uint8Array): Authority {
  if (type === AuthorityType.Ed25519) {
    return Ed25519Authority.fromBytes(data);
  }

  if (type === AuthorityType.Ed25519Session) {
    return Ed25519SessionAuthority.fromBytes(data);
  }

  if (type === AuthorityType.Secp256k1) {
    return Secp256k1Authority.fromBytes(data);
  }

  throw new Error('Invalid authority');
}
