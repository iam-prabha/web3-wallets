"use client"
import { useState } from "react";
import { Keypair, PublicKey } from "@solana/web3.js";
import { derivePath } from "ed25519-hd-key";
import { mnemonicToSeed } from "bip39";
import { generateMnemonic } from "bip39";
import nacl from "tweetnacl";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Wallet, HDNodeWallet } from "ethers";



export default function GenerateWallet() {

  const [currentIndex, setCurrentIndex] = useState(0);
  const [publicKeys, setPublicKeys] = useState<PublicKey[]>([]);
  const [mnemonic, setMnemonic] = useState("");
  const [addresses, setAddresses] = useState<String[]>([]);

  const generateNewMnmonic = async () => {
    const mn = generateMnemonic();
    setMnemonic(mn);
    console.log(mn)
  }
  const solanaWallet = async () => {
    const seed = await mnemonicToSeed(mnemonic);
    const path = `m/44'/501'/${currentIndex}'/0'`;
    const derivedSeed = derivePath(path, seed.toString("hex")).key;
    const secret = nacl.sign.keyPair.fromSeed(derivedSeed).secretKey;
    const keypair = Keypair.fromSecretKey(secret);
    setCurrentIndex(currentIndex + 1);
    setPublicKeys([...publicKeys, keypair.publicKey]);
  }
  const ethWallet = async () => {
    const seed = await mnemonicToSeed(mnemonic);
    const derivationPath = `m/44'/60'/${currentIndex}'/0'`;
    const hdNode = HDNodeWallet.fromSeed(seed);
    const child = hdNode.derivePath(derivationPath);
    const privateKey = child.privateKey;
    const wallet = new Wallet(privateKey);
    setCurrentIndex(currentIndex + 1);
    setAddresses([...addresses, wallet.address]);
  }

  return (
    <>
      <div className="max-w-[800px] mx-auto">
        <h1 className="text-2xl">We support's multple blockchain wallet's</h1>
        <h3>choose to blockchain to get started</h3>
        <div className="flex w-full max-w-sm md:max-w-xl items-center space-x-2">
          <Input type="text" placeholder="Enter your's secret phrase or (leave a blank to generate new..)" value={mnemonic} onChange={e => e.target.value} />
          <Button onClick={() => generateNewMnmonic}>Generate</Button>
        </div>
        <div className="py-2 flex gap-4">
          <Button className="text-xs" onClick={solanaWallet}>Solana</Button>
          <Button className="text-xs" onClick={ethWallet}>Etherum</Button>
        </div>
        <br />

        {
          // generated solana wallet
          publicKeys.map(p => <div>
            sol- {p.toBase58()}
          </div>)
        }

        {addresses.map(p => <div>
          Eth - {p}
        </div>)}

      </div>
    </>
  );
}
