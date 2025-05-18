import '@rainbow-me/rainbowkit/styles.css';

import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { ConnectionProvider } from '@solana/wallet-adapter-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from '@tanstack/react-router';
import { createWalletClient, http } from 'viem';
import { WagmiProvider, createConfig } from 'wagmi';
import { sepolia } from 'wagmi/chains';

const config = createConfig({
  chains: [sepolia], // Honestly, just a placeholder. Never USED!!
  client() {
    return createWalletClient({ transport: http() });
  },
});

const queryClient = new QueryClient();

export const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectionProvider endpoint="http://localhost:8899">
          <RainbowKitProvider>{children}</RainbowKitProvider>
        </ConnectionProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
