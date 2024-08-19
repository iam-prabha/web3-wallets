import GenerateWallet from "@/components/GenerateWallets";
import Navbar from "@/components/navbar";

export default function Home() {

  return (
    <main className="min-h-screen" >
      <Navbar />
      <GenerateWallet />
    </main>
  );
}
