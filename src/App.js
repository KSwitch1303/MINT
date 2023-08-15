import React, { useState } from "react";
import {
  Connection,
  PublicKey,
  Keypair,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { Token } from "@solana/spl-token";
import { useWallet } from "@solana/wallet-adapter-react";

const App = () => {
  const { publicKey, connect, connected } = useWallet();
  const [status, setStatus] = useState("");

  const mintNft = async () => {
    if (!publicKey) {
      setStatus("Please connect your wallet");
      return;
    }

    try {
      const connection = new Connection("https://solana-api.projectserum.com");
      const walletPublicKey = publicKey;
      const walletKeypair = new Keypair(walletPublicKey);
      const mintAuthority = walletPublicKey;

      const mintPublicKey = new PublicKey(
        "GqBj71GP7mwhgiSN2dNpZZvp7LLvPZaQQnTZyHP7EkdA"
      );
      const tokenAccountPublicKey = new PublicKey(
        "GqBj71GP7mwhgiSN2dNpZZvp7LLvPZaQQnTZyHP7EkdA"
      );
      const mintNftProgramId = new PublicKey(
        "AQm7XTyW4nUDY2aX1Y8uqhnLWWKdNmzGZfMYFHUnwV5"
      ); // Replace with your program ID
      const tokenProgramId = Token.TOKEN_PROGRAM_ID;

      const transaction = new Transaction();
      transaction.add(
        SystemProgram.createAccount({
          fromPubkey: walletPublicKey,
          newAccountPubkey: mintPublicKey,
          lamports: 10000000,
          space: 82,
          programId: tokenProgramId,
        })
      );

      // Initialize the mint
      transaction.add(
        Token.createInitMintInstruction(
          tokenProgramId,
          mintPublicKey,
          0, // Decimals
          walletPublicKey, // Mint authority
          walletPublicKey // Freeze authority
        )
      );

      // Create a token account
      transaction.add(
        Token.createInitAccountInstruction(
          tokenProgramId,
          mintPublicKey,
          tokenAccountPublicKey,
          walletPublicKey
        )
      );

      // Mint NFT to the token account
      transaction.add(
        Token.createMintToInstruction(
          tokenProgramId,
          mintPublicKey,
          tokenAccountPublicKey,
          walletPublicKey, // Mint authority
          [],
          1 // Amount to mint
        )
      );

      // Call the mint_nft program's mint function
      transaction.add(
        new TransactionInstruction({
          keys: [
            { pubkey: mintPublicKey, isSigner: false, isWritable: true },
            {
              pubkey: tokenAccountPublicKey,
              isSigner: false,
              isWritable: true,
            },
            // Add more keys as required by your contract
          ],
          programId: mintNftProgramId,
          data: Buffer.from([0]), // Adjust the data if needed
        })
      );

      // Sign and send the transaction
      const blockhash = await connection.getRecentBlockhash();
      transaction.recentBlockhash = blockhash.blockhash;
      transaction.feePayer = walletPublicKey;
      transaction.partialSign(walletKeypair);
      const txid = await sendAndConfirmTransaction(connection, transaction);

      setStatus("NFT minted successfully. Transaction ID: " + txid);
    } catch (error) {
      setStatus("Error minting NFT: " + error.message);
    }
  };

  return (
    <div>
      <h1>Solana NFT Minting App</h1>
      <button onClick={() => connect()}>Connect Wallet</button>
      <button onClick={mintNft} disabled={!connected}>
        Mint NFT
      </button>
      <p>Status: {status}</p>
    </div>
  );
};

export default App;
