import * as React from 'react';
import { recoverMessageAddress, stringToBytes } from 'viem';
import { useSignMessage } from 'wagmi';

export function SignMessage() {
  const [recoveredAddress, setRecoveredAddress] = React.useState<string>('');
  const {
    data: signMessageData,
    isPending,
    error,
    signMessage,
    variables,
  } = useSignMessage();

  React.useEffect(() => {
    (async () => {
      if (variables?.message && signMessageData) {
        const recoveredAddress = await recoverMessageAddress({
          message: variables?.message,
          signature: signMessageData,
        });
        setRecoveredAddress(recoveredAddress);
      }
    })();
  }, [signMessageData, variables?.message]);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.target as HTMLFormElement);
        const message = formData.get('message') as string;
        let raw = stringToBytes(message);
        signMessage({ message: { raw } });
      }}
    >
      <label htmlFor="message">Enter a message to sign</label>
      <textarea
        id="message"
        name="message"
        placeholder="The quick brown fox…"
      />
      <button disabled={isPending}>
        {isPending ? 'Check Wallet' : 'Sign Message'}
      </button>

      {signMessageData && (
        <div>
          <div>Recovered Address: {recoveredAddress}</div>
          <div>Signature: {signMessageData}</div>
        </div>
      )}

      {error && <div>{error.message}</div>}
    </form>
  );
}
