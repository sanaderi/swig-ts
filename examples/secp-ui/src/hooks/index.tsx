import { getSwigAddress, payerKeypair } from '@/helpers/solana';
import { useConnection } from '@solana/wallet-adapter-react';
import {
  Actions,
  createSecp256k1AuthorityInfo,
  createSwig,
  fetchSwig,
} from '@swig-wallet/classic';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hashMessage, recoverPublicKey } from 'viem';
import { useAccount, useSignMessage } from 'wagmi';

export function useSwig() {
  const { connection } = useConnection();
  const { swigAddress } = getSwigAddress();

  const query = useQuery({
    queryKey: ['swig'],
    queryFn: () => fetchSwig(connection, swigAddress),
  });

  return { swig: query.data, ...query };
}

export function useWalletPublicKey() {
  const { signMessageAsync } = useSignMessage();
  const { address } = useAccount();
  const queryClient = useQueryClient();

  const queryKey = ['publicKey', address];
  const queryFn = async () => {
    const message = 'sign in';
    const signature = await signMessageAsync({ message });
    const hash = hashMessage(message);
    const publicKey = recoverPublicKey({ signature, hash });
    return publicKey;
  };

  const { data: publicKey } = useQuery({
    queryKey,
    queryFn,
    enabled: false,
    staleTime: Infinity,
  });

  const getPublicKey = async () => {
    const cached = queryClient.getQueryData<`0x${string}`>(queryKey);
    if (cached) return cached;

    const publicKey = await queryFn();

    queryClient.setQueryData(queryKey, publicKey);
    return publicKey;
  };

  return {
    publicKey,
    getPublicKey,
  };
}

export function useCreateSwig() {
  const { swigId } = getSwigAddress();
  const { connection } = useConnection();
  const { getPublicKey } = useWalletPublicKey();
  const queryClient = useQueryClient();

  // Mutations
  const mutation = useMutation({
    mutationFn: async () => {
      return createSwig(
        connection,
        swigId,
        createSecp256k1AuthorityInfo(await getPublicKey()),
        Actions.set().all().get(),
        payerKeypair.publicKey,
        [payerKeypair],
      );
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['swig'] });
    },
    
  });


}
