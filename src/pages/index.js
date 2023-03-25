import Head from 'next/head';
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
const chains = require('../../public/chains.json');
import SearchModal from '../components/SearchModal';
import JsonInputModal from '../components/JsonInputModal';

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

function getUniqueFuncName(func) {
  return func.name + "(" + func.inputs.map(input => input.type).join(",") + ")";
}

export default function Home() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [contractAddress, setContractAddress] = useState('');
  const [blockchain, setBlockchain] = useState("Ethereum");
  const [chainId, setChainId] = useState("0x1");
  const [abi, setAbi] = useState(null);
  const [result, setResult] = useState({});
  const [status, _setStatus] = useState("");
  const [searchModal, setSearchModal] = useState(false);
  const [abiModal, setAbiModal] = useState(false);


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

  const supportedBlockchains = ["Ethereum", "Binance Smart Chain", "Polygon", "Sepolia"];

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

  function selectBlockchain(event) {
    if (event.target.value == "Other") {
      setSearchModal(true);
    } else {
      setBlockchain(event.target.value);
      setChainId(getChainId(event.target.value));
    }
  }

  function modalSelect(blockchain) {
    selectBlockchain({ target: { value: blockchain } });
    var blockchainList = document.getElementById("blockchainList");
    var newOption = document.createElement("option");
    newOption.innerHTML = `<option key=${blockchain} value=${blockchain}>${blockchain}</option>`.trim();
    blockchainList.insertBefore(newOption, blockchainList.lastChild);
    blockchainList.value = blockchain;
  }

  function submitCustomAbi(abi) {
    setAbi(abi);
  }

  async function setStatus(message) {
    window.scroll({ top: 0, left: 0, behavior: 'smooth' });
    _setStatus(message);
    var textElement = document.querySelectorAll(".status")[0];
    textElement.style.opacity = 1;

    clearInterval(fade2);
    fade2 = null;

    clearTimeout(fade1);
    fade1 = null;

    fade1 = setTimeout(() => {
      fadeOutText(textElement, 2000);
    }, 10000);
  }

  const fetchAbi = async () => {
    try {
      const apiUrl = "https://contract-interact-node.vercel.app/fetch-abi?contractAddress=" + contractAddress + "&blockchain=" + blockchain;
      let response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Accept": "application/json"
        }
      });
      const json = await response.json();
      return json;
    } catch (error) {
      return null;
    }
  };

  function getChainId(blockchain) {
    return "0x" + chains.filter(chain => chain.name.includes(blockchain))[0].chainId.toString(16);
  }

  useEffect(() => {
    if (contractAddress && contractAddress.length == 42 && blockchain) {
      try {
        fetchAbi().then((fetchedAbi) => {
          setAbi(fetchedAbi);
        });
      }
      catch (error) {
        setStatus('Abi not found');
        setAbi(null);
      }
    } else {
      setStatus('Abi not found');
      setAbi(null);
    }
  }, [contractAddress, blockchain]);

  const handleInteract = async (func) => {
    if (!walletAddress) {
      setStatus('Please connect your wallet first');
      return;
    }

    if (!contractAddress || contractAddress.length != 42 || !abi) {
      setStatus('Please enter a valid contract address and select a blockchain');
      return;
    }

    if (window.ethereum.networkVersion != chainId) {
      switchChain(chainId);
    }

    try {
      const values = func.inputs.map((input) => document.getElementById(func.name + "." + input.name).value);
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, abi, signer);

      var method = getUniqueFuncName(func);
      if (func.stateMutability && func.stateMutability == "view") {
        try {
          const response = await contract.functions[method](...values);
          let result_state = { ...result };
          result_state[method] = response;
          setResult(result_state); // Store the result in the state
        } catch (error) {
          setStatus(JSON.stringify(error));
        }
      } else {
        // Write operation: Send a transaction and wait for it to be mined
        const tx = await contract.functions[method](...values);
        const receipt = await tx.wait();
        console.log(receipt);
      }
    } catch (error) {
      setStatus(JSON.stringify(error));
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
        <SearchModal
          isOpen={searchModal}
          onSelect={modalSelect}
          onClose={() => setSearchModal(false)}
        />
        <JsonInputModal
          isOpen={abiModal}
          onSubmit={submitCustomAbi}
          onClose={() => setAbiModal(false)}
        />
        <div className="row">
          <input className='main' type="text" placeholder='Contract Address..' value={contractAddress} onChange={event => setContractAddress(event.target.value)} />
          <select className='main' id='blockchainList' onChange={selectBlockchain}>
            {supportedBlockchains.map((blockchain) => (
              <option key={blockchain} value={blockchain}>
                {blockchain}
              </option>
            ))}
            <option key="Other" value="Other">Other</option>
          </select>
          <button className='abiButton' onClick={() => setAbiModal(true)}>+ABI</button>
        </div>
        <h4 id="status" className='status'>{status}</h4>
        {
          abi && (
            <div className='contract'>
              {/* Render buttons and input fields for each function in the ABI */}
              {abi
                .filter((item) => item.type === 'function')
                .map((func) => (
                  <div className='center-content' key={getUniqueFuncName(func)}>
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
                    {result[getUniqueFuncName(func)] && (
                      <div>
                        {result[getUniqueFuncName(func)].map((r) => <p>{formatSolidityData(r)}</p>)}
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
