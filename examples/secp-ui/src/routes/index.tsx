import { SignMessage } from '@/components/SignMessge';
import { createFileRoute } from '@tanstack/react-router';
import { useAccount } from 'wagmi';

export const Route = createFileRoute('/')({
  component: App,
});

function App() {
  const { isConnected } = useAccount();

  return (
    <div className="text-center">
      {/* <header className="min-h-screen flex flex-col items-center justify-center bg-[#282c34] text-white text-[calc(10px+2vmin)]"></header> */}
      <div>{isConnected ? <SignMessage /> : 'not connected'}</div>
    </div>
  );
}
