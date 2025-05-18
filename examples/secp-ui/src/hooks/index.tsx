import { getSwigAddress } from '@/helpers/solana';
import { useConnection } from '@solana/wallet-adapter-react';
import { createSwig, fetchSwig } from '@swig-wallet/classic';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { hashMessage, recoverPublicKey } from 'viem';
import { useAccount, useSignMessage } from 'wagmi';

// function getSwigAddress

export function useSwig() {
  const { connection } = useConnection();

  const { swigAddress } = getSwigAddress();

  const query = useQuery({
    queryKey: ['swig'],
    queryFn: () => fetchSwig(connection, swigAddress),
  });

  return { swig: query.data, ...query };
}

export function useWalletSigner() {
  const { signMessageAsync, data } = useSignMessage();
  const { address } = useAccount();

  const query = useQuery({
    queryKey: ['publicKey', { address }],
    queryFn: async function () {
      
      const message = 'sign in';
      const signature = await signMessageAsync({ message });
      const hash = hashMessage(message);
      return recoverPublicKey({ signature, hash });
    },

  });
}

// export function useCreateSwig() {
//   const { swigAddress, swigId } = getSwigAddress();
//   const { connection } = useConnection();
//   const {} = useAccount();

//   const queryClient = useQueryClient();

//   // Mutations
//   const mutation = useMutation({
//     mutationFn: () => {
//       createSwig(connection, swigId);
//     },
//     onSuccess: () => {
//       // Invalidate and refetch
//       queryClient.invalidateQueries({ queryKey: ['swig'] });
//     },
//   });
// }
