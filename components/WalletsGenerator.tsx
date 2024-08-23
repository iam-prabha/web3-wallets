"use client";

import { Keypair } from "@solana/web3.js";
import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from "bip39";
import bs58 from "bs58";
import { derivePath } from "ed25519-hd-key";
import { ethers } from "ethers";
import React, { ChangeEvent, ReactNode, useEffect, useState } from "react";
import { toast } from "sonner";
import nacl from "tweetnacl";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { ChevronDown, ChevronUp, Copy } from "lucide-react";
import WalletListUI from "./WalletListUI";


export interface Wallet {
  mnemonic: string;
  publicKey: string;
  privateKey: string;
  path: string;
}
const WalletsGenerator = () => {

  const [mnemonic, setMnemonic] = useState<string[]>(Array(12).fill(" "));
  const [pathTypes, setPathTypes] = useState<string[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [mnemonicInput, setMnemonicInput] = useState<string>("");
  const [showMnemonic, setShowMnemonic] = useState<boolean>(false);
  const [visiblePrivateKeys, setVisiblePrivateKeys] = useState<boolean[]>([]);
  const [visiblePhrases, setVisiblePhrases] = useState<boolean[]>([]);
  const [gridView, setGridView] = useState<boolean>(false);
  const pathTypeNames: { [key: string]: string } = {
    "501": "Solana",
    "60": "Ethereum",
  };

  const pathTypeName = pathTypeNames[pathTypes[0]] || "";

  useEffect(() => {
    const storedWallets = localStorage.getItem("wallets");
    const storedMnemonic = localStorage.getItem("mnemonics");
    const storedPathTypes = localStorage.getItem("paths");

    if (storedWallets && storedMnemonic && storedPathTypes) {
      setMnemonic(JSON.parse(storedMnemonic));
      setWallets(JSON.parse(storedWallets));
      setPathTypes(JSON.parse(storedPathTypes));
      setVisiblePrivateKeys(JSON.parse(storedWallets).map(() => false));
      setVisiblePhrases(JSON.parse(storedWallets).map(() => false));
    }
  }, []);

  const handleDeleteWallet = (index: number) => {
    const updatedWallets = wallets.filter((_, i) => i !== index);
    const updatedPathTypes = pathTypes.filter((_, i) => i !== index);

    setWallets(updatedWallets);
    setPathTypes(updatedPathTypes);
    localStorage.setItem("wallets", JSON.stringify(updatedWallets));
    localStorage.setItem("paths", JSON.stringify(updatedPathTypes));
    setVisiblePrivateKeys(visiblePrivateKeys.filter((_, i) => i !== index));
    setVisiblePhrases(visiblePhrases.filter((_, i) => i !== index));
    toast.success("Wallet deleted successfully!");
  };

  const handleClearWallets = () => {
    localStorage.removeItem("wallets");
    localStorage.removeItem("mnemonics");
    localStorage.removeItem("paths");
    setWallets([]);
    setMnemonic([]);
    setPathTypes([]);
    setVisiblePrivateKeys([]);
    setVisiblePhrases([]);
    toast.success("All wallets cleared.");
  };

  const togglePrivateKeyVisibility = (index: number) => {
    setVisiblePrivateKeys(
      visiblePrivateKeys.map((visible, i) => (i === index ? !visible : visible))
    );
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast("Phrase Copied");
  };

  const generateWalletFromMnemonic = (
    pathType: string,
    mnemonic: string,
    accountIndex: number
  ): Wallet | null => {
    try {
      const seedBuffer = mnemonicToSeedSync(mnemonic);
      const path = `m/44'/${pathType}'/0'/${accountIndex}'`;
      const { key: derivedSeed } = derivePath(path, seedBuffer.toString("hex"));

      let publicKeyEncoded: string;
      let privateKeyEncoded: string;

      if (pathType === "501") {
        const { secretKey } = nacl.sign.keyPair.fromSeed(derivedSeed);
        const keypair = Keypair.fromSecretKey(secretKey);

        publicKeyEncoded = keypair.publicKey.toBase58();
        privateKeyEncoded = bs58.encode(secretKey);
      } else if (pathType === "60") {
        const privateKey = Buffer.from(derivedSeed).toString("hex");
        privateKeyEncoded = privateKey;

        const wallet = new ethers.Wallet(privateKey);
        publicKeyEncoded = wallet.address;
      } else {
        toast.error("Unsupported path type");
        return null;
      }

      return {
        publicKey: publicKeyEncoded,
        privateKey: privateKeyEncoded,
        mnemonic,
        path,
      };
    } catch (error) {
      toast.error("Failed to generate wallet. Please try again.");
      return null;
    }
  };

  const handleGenerateWallet = () => {
    let mnemonic = mnemonicInput.trim();

    if (mnemonic) {
      if (!validateMnemonic(mnemonic)) {
        toast.error("Invalid phrase, please try again!");
        return;
      }
    } else {
      mnemonic = generateMnemonic();
    }
    const words = mnemonic.split(" ");
    setMnemonic(words);

    const wallet = generateWalletFromMnemonic(pathTypes[0], mnemonic, wallets.length);

    if (wallet) {
      const updatedWallets = [...wallets, wallet];
      setWallets(updatedWallets);
      localStorage.setItem("wallets", JSON.stringify(updatedWallets));
      localStorage.setItem("mnemonics", JSON.stringify(words));
      localStorage.setItem("paths", JSON.stringify(pathTypes));
      setVisiblePrivateKeys([...visiblePrivateKeys, false]);
      setVisiblePhrases([...visiblePhrases, false]);
      toast.success("Wallet generated successfully!");
    };
  };

  const handleAddWallet = () => {
    if (!mnemonic) {
      toast.error("No mnemonic found. Please generate a wallet first.");
      return;
    };
  };



  const handleNetworkSelect = (value: string): void => {
    switch (value) {
      case "solana":
        setPathTypes(["501"]);
        toast.success("Wallet solana was selected!");
        break;
      case "eth":
        setPathTypes(["60"]);
        toast.success("Wallet Ethereum was selected!")
        break;
      default:
        setPathTypes([]);
    }
    // console.log(value);

  }

  const handleOnChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setMnemonicInput(event.target.value);
    setMnemonicInput("");
  }

  return (

    <div>
      <h1 className="text-2xl font-bold">We support multiple blockchain wallets</h1>
      <h3 className="py-2">Choose a blockchain to get started</h3>
      <div className="py-2 flex items-center gap-4">
        <h1>Choose the blockchain Network :</h1>
        <Select onValueChange={
          handleNetworkSelect} required={true}>
          <SelectTrigger className="max-w-[300px]">
            <SelectValue placeholder="Select a Blockchain Network" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Blockchain Network</SelectLabel>
              <SelectItem value="solana">Solana</SelectItem>
              <SelectItem value="eth">Ethereum</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {
        pathTypes.length !== 0 && (

          <div className="sm:max-w-sm max-w-sm py-2 md:flex md:max-w-xl items-center space-x-2">
            <Input
              type="text"
              placeholder="Enter your secret phrase or leave blank to generate a new one"
              value={mnemonicInput}
              onChange={handleOnChange}
            />
            <Button onClick={() => handleGenerateWallet()} className="sm:w-full md:w-[200px]">
              {mnemonicInput ? "Add Wallet" : "Generate Wallet"}
            </Button>
          </div>
        )
      }
      <br />
      {
        mnemonic && wallets.length > 0 && (
          <>
            <div className=" group flex flex-col items-center gap-4 cursor-pointer rounded-lg border border-primary/10 p-8">
              <div className="flex w-full justify-between items-center"
                onClick={() => setShowMnemonic(!showMnemonic)}
              >
                <h2 className="text-2xl md:text-3xl font-bold tracking-tighter">
                  Your Secret Phrase
                </h2>
                <Button onClick={() => setShowMnemonic(!showMnemonic)} variant="ghost">
                  {showMnemonic ? (
                    <ChevronUp className="size-4" />
                  ) : (
                    <ChevronDown className="size-4" />
                  )}
                </Button>
              </div>
            </div>

            {showMnemonic &&
              (
                <div className="flex flex-col w-full items-center justify-center"
                  onClick={() => copyToClipboard(mnemonic.join(" "))}
                >
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 justify-center w-full items-center mx-auto my-8">
                    {
                      mnemonic.map((word, index) => <p key={index}
                        className="md:text-lg bg-foreground/5 hover:bg-foreground/10 transition-all duration-300 rounded-lg p-4"
                      >
                        {word}
                      </p>)
                    }
                    <div className="text-sm md:text-base text-primary/50 flex w-full gap-2 items-center group-hover:text-primary/80 transition-all duration-300">
                      <Copy className="size-4" /> click Anywhere to copy
                    </div>
                  </div>
                </div>
              )}

          </>
        )
      }
      <br />
      {
        wallets.length > 0 && (
          <WalletListUI value={{ handleAddWallet, wallets, pathTypeName, gridView, setGridView, copyToClipboard, handleClearWallets, visiblePrivateKeys, togglePrivateKeyVisibility, handleDeleteWallet }} />

        )
      }

    </div>
  );
};

export default WalletsGenerator;