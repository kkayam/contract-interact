import Head from 'next/head';
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';


function formatSolidityData(value) {
  if (value === null || value === undefined) {
    return "";
  }

  if (value.type && value.type == "BigNumber") {
    return value.toNumber();
  }

  if (Array.isArray(value)) {
    return value.map(item => formatSolidityData(item)).toString();
  }

  if (typeof value === "string") {
    if (value.startsWith("0x") && value.length === 42) {
      // Assume it's an address
      return value.toLowerCase();
    }
    return value;
  }

  if (typeof value === "boolean") {
    return value.toString();
  }

  return value.toString();
}

export default function Home() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [contractAddress, setContractAddress] = useState('');
  const [blockchain, setBlockchain] = useState("Ethereum");
  const [abi, setAbi] = useState(null);
  const [result, setResult] = useState({});
  const [status, _setStatus] = useState("");


  var fade1;
  var fade2;


  function fadeOutText(element, duration) {
    const fadeDuration = duration || 5000;
    let opacity = 1;
    const fadeStep = 20; // Adjust this value to change the smoothness of the fade-out effect
    const interval = fadeDuration / fadeStep;

    fade2 = setInterval(() => {
      opacity -= 1 / fadeStep;
      element.style.opacity = opacity;

      if (opacity <= 0) {
        clearInterval(fade2);
      }
    }, interval);
  }

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


  async function switchChain(chainId) {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      });
    } catch (switchError) {
      console.error(switchError);
    }
  }

  async function setStatus(message) {
    _setStatus(message);
    var textElement = document.querySelectorAll(".status")[0];
    textElement.style.opacity = 1;
    clearInterval(fade2);
    clearTimeout(fade1);
    fade1 = setTimeout(() => {
      fadeOutText(textElement, 2000);
    }, 3000);
  }

  const fetchAbi = async () => {
    const apiUrl = "https://contract-interact-node.vercel.app/fetch-abi?contractAddress=" + contractAddress + "&blockchain=" + blockchain;
    let response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    });
    const json = await response.json();
    return json;
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
      setStatus('Please connect your wallet first');
      return;
    }

    if (!abi) {
      setStatus('Please enter a valid contract address and select a blockchain');
      return;
    }

    if (window.ethereum.networkVersion != blockchainOptions[blockchain].chainId) {
      switchChain(blockchainOptions[blockchain].chainId);
    }

    try {
      const values = func.inputs.map((input) => document.getElementById(func.name + "." + input.name).value);
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(contractAddress, abi, provider);
      try {
        const response = await contract.functions[func.name](...values);
        let result_state = { ...result };
        result_state[func.name] = response;
        setResult(result_state); // Store the result in the state
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
        {walletAddress ? (
          <p>Connected wallet address: {walletAddress}</p>
        ) : (
          <button onClick={handleWalletConnect}>Connect your wallet</button>
        )}
        <div className="row">
          <input className='main' type="text" placeholder='Contract Address..' value={contractAddress} onChange={event => setContractAddress(event.target.value)} />
          <select className='main' id='blockchainList' value={blockchain.name} onChange={event => setBlockchain(event.target.value)}>
            {Object.values(blockchainOptions).map((blockchain) => (
              <option key={blockchain.name} value={blockchain.name}>
                {blockchain.name}
              </option>
            ))}
          </select>
        </div>
        <h4 id="status" className='status'>{status}</h4>
        {
          abi && (
            <div className='contract'>
              {/* Render buttons and input fields for each function in the ABI */}
              {abi
                .filter((item) => item.type === 'function')
                .map((func) => (
                  <div className='center-content' key={func.name + "." + func.inputs.map(input => input.name).join(".")}>
                    <div className="function-row">
                      <h4 className='function-title'>{func.name}</h4>
                      {func.inputs.length > 0 &&
                        <div className='function-inputs'>
                          {func.inputs.map((input, index) => (
                            <label key={index} className="interact-input">
                              <input id={func.name + "." + input.name} placeholder={`${input.name} (${input.type})`} />
                            </label>
                          ))}
                        </div>}
                      <div className='function-interact-button center-content'>
                        <button className="interact-button" onClick={() => handleInteract(func)}>Interact</button>
                      </div>
                    </div>
                    {result[func.name] && (
                      <div>
                        {result[func.name].map((r) => <p>{formatSolidityData(r)}</p>)}
                      </div>
                    )}
                  </div>
                ))
              }
            </div >
          )
        }
      </main >
    </div >
  );
};
