use anyhow::Result;
use solana_sdk::pubkey::Pubkey;
use swig_interface::RemoveAuthorityInstruction;

pub fn sanity() -> Result<Vec<u8>> {
    let authority = Pubkey::new_from_array([2u8; 32]);
    let swig_account = Pubkey::new_from_array([3u8; 32]);

    let ix = RemoveAuthorityInstruction::new_with_ed25519_authority(
        swig_account,
        authority,
        authority,
        1,
        2,
    )?;

    Ok(ix.data)
}
