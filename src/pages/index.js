import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
const chains = require('../../public/chains.json');
import SearchModal from '../components/SearchModal';
import JsonInputModal from '../components/JsonInputModal';
import { useRouter } from 'next/router';


function getUniqueFuncName(func) {
  return func.name + "(" + func.inputs.map(input => input.type).join(",") + ")";
}

export default function Home() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [contractAddress, setContractAddress] = useState('');
  const [blockchain, setBlockchain] = useState("Ethereum");
  const [chainId, setChainId] = useState("0x1");
  const [abi, setAbi] = useState(null);
  const [contractName, setContractName] = useState("");
  const [result, setResult] = useState({});
  const [status, _setStatus] = useState("");
  const [searchModal, setSearchModal] = useState(false);
  const [abiModal, setAbiModal] = useState(false);

  const router = useRouter();
  const addressInput = useRef(null);

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
      // Assume it's an address
      const regex_address = /\b\w{42}\b/g;
      value = value.replace(regex_address, (match) => `<a target=”_blank” href="${chains.filter(chain => chain.name.includes(blockchain))[0].explorers[0].url + "/address/" + match}">${match}</a>`);
      const regex_transaction = /\b\w{66}\b/g;
      return value.replace(regex_transaction, (match) => `<a target=”_blank” href="${chains.filter(chain => chain.name.includes(blockchain))[0].explorers[0].url + "/tx/" + match}">${match}</a>`);
    }

    if (typeof value === "boolean") {
      return value.toString();
    }

    return value.toString();
  }

  const supportedBlockchains = ["Ethereum", "Binance Smart Chain", "Polygon", "Sepolia"];

  const handleWalletConnect = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        if (window.ethereum) {
          setWalletAddress((await window.ethereum.request({ method: 'eth_requestAccounts' }))[0]);
        }
      }
      else {
        window.open("https://metamask.app.link/dapp/www.contractinteract.com/");
      }
    } catch (error) {
      setStatus('Error connecting wallet');
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
    if (!supportedBlockchains.includes(blockchain)) {
      var newOption = document.createElement("option");
      newOption.innerHTML = `<option key=${blockchain} value=${blockchain}>${blockchain}</option>`.trim();
      blockchainList.insertBefore(newOption, blockchainList.lastChild);
    }
    blockchainList.value = blockchain;
  }

  function submitCustomAbi(abi) {
    setAbi(abi);
  }

  async function setStatus(message) {
    window.scroll({ top: 0, left: 0, behavior: 'smooth' });
    _setStatus(message);
    var textElement = document.querySelectorAll("#status")[0];

    textElement.className = "";
    textElement.offsetWidth;
    textElement.className = "status";
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
    if (router.isReady) {
      if (router.query.blockchain) {
        modalSelect(router.query.blockchain);
      }
      if (router.query.contractAddress) {
        setContractAddress(router.query.contractAddress);
      }
    }
  }, [router.isReady]);

  useEffect(() => {
    addressInput.current.focus();
  }, []);

  useEffect(() => {
    if (contractAddress && contractAddress.length == 42 && blockchain) {
      try {
        fetchAbi().then((fetchedAbi) => {
          if (!fetchedAbi || fetchedAbi.ABI == null) {
            setStatus('Abi not found');
          } else {
            setAbi(fetchedAbi.ABI);
            setContractName(fetchedAbi.ContractName ? fetchedAbi.ContractName : "");
          }
        });
      }
      catch (error) {
        setStatus('Abi not found');
        setAbi(null);
      }
    } else {
      setAbi(null);
    }
    if (router.isReady) {
      if (contractAddress) {
        router.push(
          {
            pathname: '/',
            query: { blockchain, contractAddress }
          }, undefined,
          { shallow: true }
        );
      } else {
        router.push(
          {
            pathname: '/',
            query: { blockchain }
          }, undefined,
          { shallow: true }
        );
      }
    }
  }, [contractAddress, blockchain]);

  const handleInteract = async (func) => {
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

      var method = getUniqueFuncName(func);
      if (func.stateMutability && func.stateMutability == "view") {
        try {
          const contract = new ethers.Contract(contractAddress, abi, provider);
          const response = await contract.functions[method](...values);
          let result_state = { ...result };
          result_state[method] = response;
          setResult(result_state); // Store the result in the state
        } catch (error) {
          setStatus(JSON.stringify(error.reason || error));
        }
      } else {
        if (!walletAddress) {
          setStatus('Please connect your wallet first');
          return;
        }
        // Write operation: Send a transaction and wait for it to be mined
        const contract = new ethers.Contract(contractAddress, abi, signer);
        const tx = await contract.functions[method](...values);
        const receipt = await tx.wait();
        console.log(receipt);
        let result_state = { ...result };
        result_state[method] = ["Transaction successful: " + receipt.transactionHash];
        setResult(result_state); // Store the result in the state
      }
    } catch (error) {
      setStatus(JSON.stringify(error.reason || error.message));
    }
  };

  return (
    <div>
      <Head>
        <title>Contract Interact</title>
      </Head>

      <main>
        <p className='header'>Add any valid contract address below and select the target blockchain to start interacting with the contract. If ABI is missing, or the target blockchain is Other, you must provide your own ABI.</p>
        <div className='walletAddressContainer'>
          {walletAddress ? (
            <p>Connected wallet address: {walletAddress}</p>
          ) : (
            <button onClick={handleWalletConnect}>Connect your wallet</button>
          )}
        </div>
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
          <input ref={addressInput} className='main' type="text" placeholder='0x00000..' value={contractAddress} onChange={event => setContractAddress(event.target.value)} />
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
              <h2 className='contract-name'>{contractName}</h2>
              {/* Render buttons and input fields for each function in the ABI */}
              {abi
                .filter((item) => item.type === 'function')
                .map((func) => (
                  <div className="function-container" key={getUniqueFuncName(func)}>
                    <div className="function-row">
                      <div className='function-title'>
                        <p className={(func.stateMutability == "view") ? "function-title read" : "function-title write"}>{func.name}</p>
                      </div>
                      {func.inputs.length > 0 &&
                        <div className='function-inputs'>
                          {func.inputs.map((input, index) => (
                            <input key={index} className="interact-input" id={func.name + "." + input.name} placeholder={`${input.name} (${input.type})`} />
                          ))}
                        </div>}
                      <button className="interact-button" onClick={() => handleInteract(func)}>Interact</button>
                    </div>
                    <div className='func-result'>
                      {result[getUniqueFuncName(func)] &&
                        result[getUniqueFuncName(func)].map((r) => <p dangerouslySetInnerHTML={{ __html: formatSolidityData(r) }}></p>)}
                    </div>
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
