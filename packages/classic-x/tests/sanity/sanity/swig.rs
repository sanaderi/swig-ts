use anyhow::Result;
use swig_state::{Action, AuthorityType, Role, Swig, TokenAction};

pub fn sanity() -> Result<Vec<u8>> {
    let mut roles = vec![
        Role::new(
            AuthorityType::Ed25519,
            vec![0u8; 32],
            0,
            0,
            vec![Action::Token {
                key: [4u8; 32],
                action: TokenAction::Manage(100),
            }],
        ),
        Role::new(
            AuthorityType::Ed25519,
            vec![1u8; 32],
            0,
            0,
            vec![Action::All],
        ),
        Role::new(
            AuthorityType::Ed25519,
            vec![2u8; 32],
            0,
            0,
            vec![Action::All],
        ),
    ];
    roles[0].actions.push(Action::Token {
        key: [0u8; 32],
        action: TokenAction::Manage(100),
    });
    roles[1].actions.push(Action::Token {
        key: [1u8; 32],
        action: TokenAction::Manage(100),
    });
    roles[2].actions.push(Action::Token {
        key: [2u8; 32],
        action: TokenAction::Manage(100),
    });
    let swig = Swig::new([0u8; 13], 0, roles);

    let serialized = borsh::to_vec(&swig).unwrap();

    Ok(serialized)
}
