use anyhow::Result;
use solana_sdk::pubkey::Pubkey;
use swig_interface::{AuthorityConfig, ReplaceAuthorityInstruction};
use swig_state::{Action, AuthorityType, TokenAction};

pub fn sanity() -> Result<Vec<u8>> {
    let authority = Pubkey::new_from_array([2u8; 32]);
    let swig_account = Pubkey::new_from_array([3u8; 32]);

    let new_authority = Pubkey::new_from_array([4u8; 32]);

    let new_authority_config = AuthorityConfig {
        authority: &new_authority.to_bytes(),
        authority_type: AuthorityType::Ed25519,
    };

    let ix = ReplaceAuthorityInstruction::new_with_ed25519_authority(
        swig_account,
        authority,
        authority,
        1,
        2,
        new_authority_config,
        vec![Action::Token {
            key: [5u8; 32],
            action: TokenAction::Manage(200),
        }],
        0,
        0,
    )?;

    Ok(ix.data)
}
