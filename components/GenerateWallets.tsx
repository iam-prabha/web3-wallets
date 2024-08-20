"use client"
import { useState } from "react";
import { Keypair, PublicKey } from "@solana/web3.js";
import { mnemonicToSeedSync, validateMnemonic } from "bip39";
import { derivePath } from "ed25519-hd-key";
import { generateMnemonic } from "bip39";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner";
import nacl from "tweetnacl";
import bs58 from "bs58"
import { ethers } from "ethers";

interface Wallet {
  mnemonic : string;
  publicKey: string;
  privateKey: string;
  path : string;
}
export default function GenerateWallet() {
  const [Wallet,setWallet] = useState<Wallet[]>([]);
  const [mnemonicInput, setMnemonicInput] = useState<string>("");
  const [mnemonic, setMnemonic] = useState<String[]>(Array(12).fill(" "))
  // const [publicKeys, setPublicKeys] = useState<PublicKey[]>([]);
  // const [addresses, setAddresses] = useState<String[]>([]);
  // const [currentIndex, setCurrentIndex] = useState(0);
  const [pathTypes,setPathTypes] = useState<string[]>([]);
  const pathTypeNames : { [key :string] : string } = {
    "501" : "solana",
    "60" : "Ethereum",
  }

  const pathTypeName = pathTypeNames[pathTypes[0]] || "";

  //generate wallet from mnemonic
  const generateWalletFromMnemonic =(
    pathType : String,
    mnemonic:string,
    accountIndex : number,
  ) : Wallet | null => {
    try {
      const seedBuffer = mnemonicToSeedSync(mnemonic);
      const path = `m/44'/${pathType}/0'/${accountIndex}'`;
      const {key : derivedSeed } = derivePath(path,seedBuffer.toString("hex"));

      let publicKeyEncoded : string;
      let privateKeyEncoded : string;
      if (pathType == "501"){
        //solana
        const { secretKey } = nacl.sign.keyPair.fromSeed(derivedSeed);
        const keypair = Keypair.fromSecretKey(secretKey);

        publicKeyEncoded = bs58.encode(secretKey);
        privateKeyEncoded = keypair.publicKey.toBase58();
      }else if (pathType = "60"){
        //Ethereum
        const privateKey = Buffer.from(derivedSeed).toString("hex");
        privateKeyEncoded = privateKey;

        const Wallet = new  ethers.Wallet(privateKey);
        publicKeyEncoded = Wallet.address;
      }else{
        toast.error("unsupport path type");
        return null;
      }

      return {
        publicKey : publicKeyEncoded,
        privateKey : privateKeyEncoded,
        mnemonic,
        path,
      };
    } catch (error) {
      toast.error("Failed to generate wallet. Please try again.");
      return null;
    }
  }

  const handleGenerateWallet = async () => {
    let mnemonic = mnemonicInput.trim();

    if (mnemonic) {
      if (!validateMnemonic(mnemonic)) {
        toast.error("Invalid phrase , please try again !");
        return;
      }
    } else {
      mnemonic = generateMnemonic();
    }
    const words = mnemonic.split(" ");
    setMnemonic(words);

    const wallet = generateWalletFromMnemonic(
      pathTypes[0],
      mnemonic,
      Wallet.length
    );

    if (wallet){
      const upatedWallet = [...Wallet,wallet];
      setWallet(upatedWallet);
      toast.success("wallet generated successfully!")
    }
   
  };
  const handleAddwallet = () =>{
    if (!mnemonic){
      toast.error("No mnemonic found. please generate a wallet first");
      return;
    }
  };

  const wallet = generateWalletFromMnemonic(
    pathTypes[0],
    mnemonic.join(" "),
    Wallet.length
  );


  if (wallet){
    const upatedWallet = [...Wallet,wallet];
    const updatePathType = [pathTypeNames,pathTypes]
    setWallet(upatedWallet);
    toast.success("wallet generated successfully!")
  }

  return (
    <>
      <div className="max-w-[1200px] mx-auto sm:px-2">
        <h1 className="text-2xl text-balance ">We support's multple blockchain wallet's</h1>
        <h3 className="py-2">choose to blockchain to get started</h3>
        
        <div className="sm:max-w-sm max-w-sm py-2 md:flex md:max-w-xl  items-center space-x-2">
          <Input type="text" placeholder="Enter your's secret phrase or (leave a blank to generate new..)" className="justify-center" value={mnemonicInput} onChange={e => setMnemonicInput(e.target.value)} />
          <Button onClick={() =>  handleGenerateWallet() } className="sm:w-full md:w-[200px]">{mnemonicInput ? "Add wallet " : "Generate Wallet"}</Button>
        </div>

         {/* choose selector div section */}
        <div className="py-2 flex items-center gap-4">
          <h1>Choose the blockchain Network :</h1>
          <Select>
            <SelectTrigger className="max-w-[300px]">
              <SelectValue placeholder="Select a Blockchain Network" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Blockchain Network</SelectLabel>
                <SelectItem value="solana">Solana</SelectItem>
                <SelectItem value="eth">Etherum</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <br />
        {
          // display mnemonic words
          mnemonic.map((mn, index) =>
            <div key={index} className="w-full">
              <p >{mn}</p>
            </div>
          )
        }

      </div>
    </>
  );
}
