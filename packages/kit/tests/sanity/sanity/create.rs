use anyhow::Result;
use solana_sdk::pubkey::Pubkey;
use swig_interface::{AuthorityConfig, CreateInstruction};
use swig_state::AuthorityType;

pub fn sanity() -> Result<Vec<u8>> {
    let authority = Pubkey::new_from_array([2u8; 32]);
    let swig_account = Pubkey::new_from_array([3u8; 32]);

    let ix = CreateInstruction::new(
        swig_account,
        0,
        authority,
        AuthorityConfig {
            authority_type: AuthorityType::Ed25519,
            authority: &authority.to_bytes(),
        },
        &[2u8; 13],
        0,
        0,
    )?;

    Ok(ix.data)
}
