import Head from 'next/head';
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';


export default function Home() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [contractAddress, setContractAddress] = useState('');
  const [blockchain, setBlockchain] = useState('');
  const [abi, setAbi] = useState(null);
  const [result, setResult] = useState(null);


  const blockchainOptions = {
    // Add your supported EVM blockchains here with their chainId values
    Ethereum: {
      name: 'Ethereum', chainId: '0x1',
      abiUrl: 'https://api.etherscan.io/api?module=contract&action=getabi&address=',
    },
    BSC: {
      name: 'Binance Smart Chain', chainId: '0x38',
      abiUrl: 'https://api.bscscan.com/api?module=contract&action=getabi&address=',
    },
    Polygon: {
      name: 'Polygon (Matic)', chainId: '0x89',
      abiUrl: 'https://api.polygonscan.com/api?module=contract&action=getabi&address=',
    },
  };

  const handleWalletConnect = async () => {
    try {

      if (typeof window.ethereum !== 'undefined') {
        if (window.ethereum) {
          setWalletAddress((await window.ethereum.request({ method: 'eth_requestAccounts' }))[0]);
        }
      } else {
        console.error('Ethereum provider not found');
        throw new Error('Ethereum provider not found');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };


  async function switchEthereumChain(chainId) {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      });
    } catch (switchError) {
      console.error(switchError);
    }
  }


  const fetchAbi = async () => {
    let abi;
    const apiKey = "";
    const apiUrl = blockchainOptions[blockchain].abiUrl + `${contractAddress}&apikey=${apiKey}`;
    const response = await fetch(apiUrl);
    const data = await response.json();
    if (data.status === '1') {
      abi = JSON.parse(data.result);
    }
    return abi;
  };

  useEffect(() => {
    if (contractAddress && blockchain) {
      fetchAbi().then((fetchedAbi) => {
        setAbi(fetchedAbi);
      });
    } else {
      setAbi(null);
    }
  }, [contractAddress, blockchain]);

  const handleInteract = async (func) => {
    if (!walletAddress) {
      console.error('Please connect your wallet first');
      return;
    }

    if (!abi) {
      console.error('Please enter a valid contract address and select a blockchain');
      return;
    }

    try {
      const values = func.inputs.map((input) => document.getElementById(func.name + "." + input.name));
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(contractAddress, abi, provider);
      try {
        const result = await contract.functions[func.name](...values);
        setResult(result); // Store the result in the state
      } catch (error) {
        console.error('Transaction error:', error);
      }
    } catch (error) {
      console.error('Error interacting with contract:', error);
    }
  };

  return (
    <div>
      <Head>
        <title>Blockchain Interactor</title>
      </Head>

      <main>
        <h1>Welcome to Blockchain Interactor</h1>
        <p>
          This website allows you to interact with any EVM-compatible smart contract on any supported blockchain network.
        </p>
        {walletAddress ? (
          <p>Connected wallet address: {walletAddress}</p>
        ) : (
          <button onClick={handleWalletConnect}>Connect your wallet</button>
        )}
        <div className="row">
          <label className="contract-address-input">
            Contract Address:
            <input type="text" value={contractAddress} onChange={event => setContractAddress(event.target.value)} />
          </label>
        </div>
        <div>
          <label>
            Blockchain:
            <select id='blockchainList' value={blockchain.name} onChange={event => setBlockchain(event.target.value)}>
              <option value="">Select a blockchain</option>
              {Object.values(blockchainOptions).map((blockchain) => (
                <option key={blockchain.name} value={blockchain.name}>
                  {blockchain.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        {
          abi && (
            <div>
              <h3>Contract Functions</h3>
              {/* Render buttons and input fields for each function in the ABI */}
              {abi
                .filter((item) => item.type === 'function')
                .map((func) => (
                  <div key={func.name}>
                    <h4>{func.name}</h4>
                    <div className="row">
                      {func.inputs.map((input, index) => (
                        <label key={index} className="interact-input">
                          {input.name} ({input.type}):
                          <input id={func.name + "." + input.name} placeholder={`Enter ${input.name}`} />
                        </label>
                      ))}
                      <button className="interact-button" onClick={() => handleInteract(func)}>Interact</button>
                    </div>
                    {result && (
                      <div>
                        <p>Result: {JSON.stringify(result)}</p>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )
        }
      </main >
    </div >
  );
}
