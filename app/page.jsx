"use client"
import { useState, useEffect } from "react"
import { ethers } from "ethers"
import ABI from "@/constants/abi"
import { Wallet, ArrowRight, ExternalLink, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const Faucet = () => {
  const [account, setAccount] = useState(null)
  const [chainId, setChainId] = useState(null)
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false)
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false)
  const [networkSwitchAttempted, setNetworkSwitchAttempted] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [transactionHash, setTransactionHash] = useState(null)
  const [transactionStatus, setTransactionStatus] = useState(null) // "pending", "success", "error"
  const [errorMessage, setErrorMessage] = useState("")

  const CORE_TESTNET_PARAMS = {
    chainId: "0x45A", // 1114 in hex
    chainName: "Core Testnet 2",
    rpcUrls: ["http://rpc.test2.btcs.network/"],
    nativeCurrency: {
      name: "tCORE2",
      symbol: "tCORE2",
      decimals: 18,
    },
  }

  const CONTRACT_ADDRESS = "0x80705Cc3B81A41c4e9AE785004d2F65445782a18"
  const CONTRACT_ABI = ABI

  const claimTokens = async () => {
    if (!account) {
      setErrorMessage("Please connect your wallet first.")
      setTransactionStatus("error")
      return
    }

    if (!isCorrectNetwork) {
      setErrorMessage("Please switch to Core Testnet network.")
      setTransactionStatus("error")
      return
    }

    try {
      setClaiming(true)
      setTransactionStatus("pending")
      setErrorMessage("")

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)

      const transaction = await contract.faucet()
      setTransactionHash(transaction.hash)

      await transaction.wait()
      setTransactionStatus("success")
    } catch (error) {
      console.error("Error claiming tokens:", error)
      setErrorMessage(error.message || "Failed to claim tokens")
      setTransactionStatus("error")
    } finally {
      setClaiming(false)
    }
  }

  useEffect(() => {
    const handleChainChanged = async (id) => {
      console.log("Chain ID Changed:", id)
      setChainId(id)
    }

    const getInitialChainId = async () => {
      if (window.ethereum) {
        try {
          const id = await window.ethereum.request({ method: "eth_chainId" })
          setChainId(id)
        } catch (err) {
          console.error("Error getting initial chain ID:", err)
        }
      }
    }

    getInitialChainId()

    if (window.ethereum) {
      window.ethereum.on("chainChanged", handleChainChanged)
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0])
        } else {
          setAccount(null)
        }
      })

      return () => {
        window.ethereum.removeListener("chainChanged", handleChainChanged)
      }
    }
  }, [])

  useEffect(() => {
    const correctNetwork = chainId === CORE_TESTNET_PARAMS.chainId
    setIsCorrectNetwork(correctNetwork)
  }, [chainId])

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        setIsSwitchingNetwork(true)
        setNetworkSwitchAttempted(false)
        setErrorMessage("")

        await switchNetwork()
        setNetworkSwitchAttempted(true)

        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        })
        setAccount(accounts[0])
      } catch (error) {
        console.error("Error connecting wallet", error)
        setErrorMessage(error.message || "Failed to connect wallet")
      } finally {
        setIsSwitchingNetwork(false)
      }
    } else {
      setErrorMessage("Please install MetaMask!")
    }
  }

  const switchNetwork = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: CORE_TESTNET_PARAMS.chainId }],
        })
        setIsCorrectNetwork(true)
      } catch (error) {
        if (error.code === 4902) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [CORE_TESTNET_PARAMS],
            })
          } catch (addError) {
            console.error("Error adding network", addError)
            throw addError
          }
        } else {
          console.error("Error switching network", error)
          throw error
        }
      }
    }
  }

  useEffect(() => {
    if (networkSwitchAttempted && chainId !== null) {
      setIsCorrectNetwork(chainId === CORE_TESTNET_PARAMS.chainId)
    }
  }, [networkSwitchAttempted, chainId])

  const formatAddress = (address) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-5">
      <div className="w-full max-w-3xl px-4">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-[#f86522] to-[#ffa02f] bg-clip-text text-transparent mb-4">
           TASHIBTC <span className="text-white">Testnet Faucet</span>
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto text-lg">
            Get testnet tokens to experiment with Core Testnet. Connect your wallet and claim tokens to start building.
          </p>
        </div>

        <Card className="bg-[#1a1a1a] border-[#333333] shadow-xl overflow-hidden">
          <CardHeader className="border-b border-[#333333] bg-[#242424]">
            <CardTitle className="text-xl text-white">Token Faucet</CardTitle>
            <CardDescription className="text-gray-400">
              Claim testnet tokens for development and testing
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {account && (
              <div className="p-4 rounded-lg bg-[#242424] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-orange-400" />
                  <span className="text-gray-300">Connected:</span>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-orange-400 font-mono">{formatAddress(account)}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{account}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}

            {!isCorrectNetwork && account && (
              <Alert variant="destructive" className="bg-red-900/20 border-red-800 text-red-300">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Wrong Network</AlertTitle>
                <AlertDescription>Please switch to Core Testnet to claim tokens</AlertDescription>
              </Alert>
            )}

            {errorMessage && (
              <Alert variant="destructive" className="bg-red-900/20 border-red-800 text-red-300">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            {transactionStatus === "success" && (
              <Alert className="bg-green-900/20 border-green-800 text-green-300">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Success!</AlertTitle>
                <AlertDescription>Tokens have been sent to your wallet</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col gap-4">
              {!account ? (
                <Button
                  onClick={connectWallet}
                  disabled={isSwitchingNetwork}
                  className="w-full py-6 bg-gradient-to-r from-[#f86522] to-[#ffa02f] hover:opacity-90 transition-all duration-200 border-0 text-white font-semibold"
                >
                  {isSwitchingNetwork ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Switching Network...
                    </>
                  ) : (
                    <>
                      Connect Wallet
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={claimTokens}
                  disabled={claiming || !isCorrectNetwork}
                  className="w-full py-6 bg-gradient-to-r from-[#f86522] to-[#ffa02f] hover:opacity-90 transition-all duration-200 border-0 text-white font-semibold"
                >
                  {claiming ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Claiming Tokens...
                    </>
                  ) : (
                    "Claim Testnet Tokens"
                  )}
                </Button>
              )}

              {!isCorrectNetwork && account && (
                <Button
                  onClick={switchNetwork}
                  variant="outline"
                  className="border-orange-500 text-orange-400 hover:bg-orange-500/10"
                >
                  Switch to Core Testnet
                </Button>
              )}
            </div>

            {transactionHash && (
              <div className="mt-4 p-4 rounded-lg bg-[#242424] animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Transaction:
                  </span>
                  <a
                    href={`https://explorer.btcs.network/tx/${transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#ffa02f] hover:text-[#f86522] transition-colors flex items-center gap-1"
                  >
                    {formatAddress(transactionHash)}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="border-t border-[#333333] bg-[#242424] p-4">
            <p className="text-xs text-gray-400 w-full text-center">
              Core Testnet tokens are for testing purposes only and have no real value.
            </p>
          </CardFooter>
        </Card>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-[#1a1a1a] border-[#333333]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-400">Network Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Name:</span>
                  <span className="text-white">{CORE_TESTNET_PARAMS.chainName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Chain ID:</span>
                  <span className="text-white">1114</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Currency:</span>
                  <span className="text-white">{CORE_TESTNET_PARAMS.nativeCurrency.symbol}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1a] border-[#333333]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-400">Contract</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Address:</span>
                  <a
                    href={`https://explorer.btcs.network/address/${CONTRACT_ADDRESS}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white hover:text-orange-400 transition-colors"
                  >
                    {formatAddress(CONTRACT_ADDRESS)}
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1a] border-[#333333]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-400">Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                <a
                  href="https://explorer.btcs.network"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex justify-between text-white hover:text-orange-400 transition-colors"
                >
                  <span>Block Explorer</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex justify-between text-white hover:text-orange-400 transition-colors"
                >
                  <span>Documentation</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Faucet

