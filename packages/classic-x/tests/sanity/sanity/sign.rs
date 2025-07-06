use anyhow::Result;
use solana_sdk::{
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
};
use swig_interface::SignInstruction;

pub fn sanity() -> Result<Vec<u8>> {
    let authority = Pubkey::new_from_array([2u8; 32]);
    let swig_account = Pubkey::new_from_array([3u8; 32]);

    let account_1 = Pubkey::new_from_array([4u8; 32]);
    let account_2 = Pubkey::new_from_array([5u8; 32]);

    let program_id = Pubkey::new_from_array([6u8; 32]);

    let ix = SignInstruction::new_ed25519(
        swig_account,
        authority,
        authority,
        Instruction {
            accounts: vec![
                AccountMeta::new(account_1, true),
                AccountMeta::new(account_2, false),
                AccountMeta::new_readonly(account_1, false),
                AccountMeta::new_readonly(swig_account, true),
            ],
            program_id,
            data: vec![7, 9],
        },
        1,
    )?;

    Ok(ix.data)
}
