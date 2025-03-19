"use client";
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import ABI from "@/constants/abi"

const Faucet = () => {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);
  const [networkSwitchAttempted, setNetworkSwitchAttempted] = useState(false); // Track if switch has been attempted
  const [claiming, setClaiming] = useState(false);
  const [transactionHash, setTransactionHash] = useState(null);

  const CORE_TESTNET_PARAMS = {
    chainId: "0x45A", // 1114 in hex
    chainName: "Core Testnet 2",
    rpcUrls: ["http://rpc.test2.btcs.network/"],
    nativeCurrency: {
      name: "tCORE2",
      symbol: "tCORE2",
      decimals: 18,
    },
  };

  const CONTRACT_ADDRESS = "0x80705Cc3B81A41c4e9AE785004d2F65445782a18"; // Replace with the actual contract address
  const CONTRACT_ABI = ABI; // Use the ABI you provided


  const claimTokens = async () => {
    if (!account) {
      alert("Please connect your wallet first.");
      return;
    }

  

    try {
      setClaiming(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      console.log(contract);

      const transaction = await contract.faucet();  // Call the faucet function
      console.log("Transaction sent:", transaction.hash);

      setTransactionHash(transaction.hash);

      await transaction.wait(); // Wait for the transaction to be mined
      console.log("Transaction mined:", transaction.hash);
      alert("Tokens claimed successfully!");
    } catch (error) {
      console.error("Error claiming tokens:", error);
      alert(`Error claiming tokens: ${error.message}`); // Show detailed error message to user
    } finally {
      setClaiming(false);
    }
  };

  useEffect(() => {
    const handleChainChanged = async (id) => {
      console.log("Chain ID Changed (event):", id);
      setChainId(id); // Update chainId state
    };

    const getInitialChainId = async () => {
      if (window.ethereum) {
        try {
          const id = await window.ethereum.request({ method: "eth_chainId" });
          console.log("Initial Chain ID:", id);
          setChainId(id);
        } catch (err) {
          console.error("Error getting initial chain ID:", err);
        }
      }
    };

    getInitialChainId();

    if (window.ethereum) {
      window.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, []);

  useEffect(() => {
    console.log("ChainId state:", chainId);
    const correctNetwork = chainId === CORE_TESTNET_PARAMS.chainId;
    setIsCorrectNetwork(correctNetwork);
    console.log("IsCorrectNetwork state:", correctNetwork);
  }, [chainId]);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        setIsSwitchingNetwork(true);
        setNetworkSwitchAttempted(false); // Reset the attempt flag

        // First, request to switch to the correct network.  We handle the add if needed inside `switchNetwork`.
        await switchNetwork();
        setNetworkSwitchAttempted(true); // Set the attempt flag after switchNetwork completes

        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setAccount(accounts[0]);
      } catch (error) {
        console.error("Error connecting wallet", error);
      } finally {
        setIsSwitchingNetwork(false);
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  const switchNetwork = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: CORE_TESTNET_PARAMS.chainId }],
        });
        console.log("Network switch request sent."); // Log success switch
        setIsCorrectNetwork(true)
      } catch (error) {
        if (error.code === 4902) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [CORE_TESTNET_PARAMS],
            });
          } catch (addError) {
            console.error("Error adding network", addError);
          }
        } else {
          console.error("Error switching network", error);
        }
      }
    }
  };

  useEffect(() => {
    if (networkSwitchAttempted && chainId !== null) {
      // Re-evaluate after the switch has been attempted.
      console.log("Re-evaluating isCorrectNetwork after switch attempt.");
      setIsCorrectNetwork(chainId === CORE_TESTNET_PARAMS.chainId);
    }
  }, [networkSwitchAttempted, chainId]);

  return (
    
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-5">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-[#f86522] to-[#ffa02f] bg-clip-text text-transparent mb-4">
          Core Testnet Faucet
        </h1>
        <p className="text-gray-400 max-w-xl mx-auto">
          Get testnet tokens to experiment with Core Testnet. Connect your wallet and claim tokens to start building.
        </p>
      </div>

      <div className="w-full max-w-xl bg-[#1a1a1a] rounded-2xl p-8 shadow-xl border border-[#333333]">
        {account && (
          <div className="mb-6 p-4 rounded-lg bg-[#242424] flex items-center justify-between">
            <p className="text-orange-400 text-sm">Connected: {account}</p>
          </div>
        )}

        {!account ? (
          <button
            onClick={connectWallet}
            disabled={isSwitchingNetwork}
            className="w-full py-4 px-6 bg-gradient-to-r from-[#f86522] to-[#ffa02f] rounded-lg font-semibold 
                     hover:opacity-90 transition-all duration-200 flex items-center justify-center
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSwitchingNetwork ? "Switching Network..." : "Connect Wallet"}
          </button>
        ) : (
          <button
            onClick={claimTokens}
            disabled={claiming}
            className="w-full py-4 px-6 bg-gradient-to-r from-[#f86522] to-[#ffa02f] rounded-lg font-semibold
                     hover:opacity-90 transition-all duration-200 flex items-center justify-center
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {claiming ? "Claiming Tokens..." : "Claim Tokens"}
          </button>
        )}

        {transactionHash && (
          <div className="mt-6 p-4 rounded-lg bg-[#242424]">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Transaction:</span>
              <a
                href={`https://explorer.btcs.network/tx/${transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#ffa02f] hover:text-[#f86522] transition-colors"
              >
                {transactionHash.substring(0, 6)}...{transactionHash.substring(transactionHash.length - 4)}
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
    
    
    // <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-5">
    //   <h1 className="text-4xl text-orange-500 font-bold">Core Testnet Faucet</h1>
    //   <p className="mt-2 text-gray-300">We are working on the faucet, but for now, you have to pay a small fee.</p>

    //   {account ? (
    //     <p className="mt-4 text-orange-400">Connected: {account}</p>
    //   ) : (
    //     <button
    //       onClick={connectWallet}
    //       className="mt-4 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg shadow-md transition"
    //       disabled={isSwitchingNetwork}
    //     >
    //       {isSwitchingNetwork ? "Switching Network..." : "Connect Wallet"}
    //     </button>
    //   )}

    //   {account &&  (
    //     <button
    //       onClick={claimTokens}
    //       className="mt-6 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg shadow-md transition"
    //       disabled={claiming}
    //     >
    //       {claiming ? "Claiming Tokens..." : "Claim Tokens"}
    //     </button>
    //   )}

    //   {transactionHash && (
    //     <p className="mt-4 text-green-400">
    //       Transaction:{" "}
    //       <a
    //         href={`https://explorer.btcs.network/tx/${transactionHash}`} // Replace with the correct explorer URL for Core Testnet
    //         target="_blank"
    //         rel="noopener noreferrer"
    //         className="underline"
    //       >
    //         {transactionHash.substring(0, 6)}...{transactionHash.substring(transactionHash.length - 4)}
    //       </a>
    //     </p>
    //   )}
    // </div>
  );
};

export default Faucet;

