# !/bin/bash

set -euo pipefail

# Get the directory of the script, root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

solana-test-validator --reset \
  --bpf-program swigypWHEksbC64pWKwah1WTeh9JXwx8H1rJHLdbQMB ${SCRIPT_DIR}/../../../swig.so \
  --account 3LGufFdQr2CfRw6jUuVSQdvd1q7kQWuC9mBZUstmDNUM ${SCRIPT_DIR}/genesis/payer-state.json \

