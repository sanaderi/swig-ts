mod sanity;

use anyhow::Result;
use sanity::*;
use std::{fs::File, io::Write};

fn main() -> Result<()> {
    println!("... generating sanity...");

    let swig = swig::sanity()?;
    generate_file(&swig, "swig")?;

    let create = create::sanity()?;
    generate_file(&create, "create")?;

    let add_authority = add_authority::sanity()?;
    generate_file(&add_authority, "add_authority")?;

    let remove_authority = remove_authority::sanity()?;
    generate_file(&remove_authority, "remove_authority")?;

    let replace_authority = replace_authority::sanity()?;
    generate_file(&replace_authority, "replace_authority")?;

    let sign = sign::sanity()?;
    generate_file(&sign, "sign")?;

    println!("sanity generated successfully!");
    Ok(())
}

fn generate_file(bytes: &[u8], name: &str) -> Result<()> {
    let mut file = File::create(format!("data/{name}.bin"))?;
    file.write_all(bytes)?;
    Ok(())
}
