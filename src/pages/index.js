import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
var chains = require('../../public/chains.json');
import SearchModal from '../components/SearchModal';
import JsonInputModal from '../components/JsonInputModal';
import FunctionContainer from '../components/FunctionContainer';
import { useRouter } from 'next/router';
import 'react-tooltip/dist/react-tooltip.css';
import { Tooltip } from 'react-tooltip';

chains.push(
  {
    "name": "Hardhat Local",
    "chain": "Hardhat Local",
    "icon": "ethereum",
    "rpc": [
      "http://localhost:8545"
    ],
    "faucets": [],
    "nativeCurrency": {
      "name": "Ether",
      "symbol": "ETH",
      "decimals": 18
    },
    "infoURL": "https://hardhat.org",
    "shortName": "eth",
    "chainId": 31337,
    "networkId": 31337,
    "explorers": [
      {
        "name": "etherscan",
        "url": "https://etherscan.io",
        "standard": "EIP3091"
      }
    ]
  }
);


function getUniqueFuncName(func) {
  return func.name + "(" + func.inputs.map(input => input.type).join(",") + ")";
}

export default function Home() {
  // Blockchain info
  const [walletAddress, setWalletAddress] = useState(null);
  const [blockchain, setBlockchain] = useState("Ethereum");
  const [chainId, setChainId] = useState("0x1");

  // Statuses
  const [result, setResult] = useState({});
  const [status, _setStatus] = useState("");
  const [abiCopied, setAbiCopied] = useState(false);
  const [walletCopied, setWalletCopied] = useState(false);

  // Modals
  const [searchModal, setSearchModal] = useState(false);
  const [abiModal, setAbiModal] = useState(false);

  // Contract info
  const [contractAddress, setContractAddress] = useState('');
  const [contract, setContract] = useState({});
  const [implementationContract, setImplementationContract] = useState({});
  const [viewImplementation, setViewImplementation] = useState(false);
  const [focusedFunction, setFocusedFunction] = useState(null);

  const router = useRouter();
  const addressInput = useRef(null);

  function copyAbi() {
    navigator.clipboard.writeText(JSON.stringify(viewImplementation ? implementationContract : contract.abi));
    setAbiCopied(true);
    setWalletCopied(false);
  }
  function copyWallet() {
    navigator.clipboard.writeText(walletAddress);
    setWalletCopied(true);
    setAbiCopied(false);
  }
  function copyContractLink() {
    var base_url = window.location.origin;
    let url = new URL(base_url);
    url.searchParams.set("blockchain", blockchain);
    url.searchParams.set("contractAddress", contractAddress);
    navigator.clipboard.writeText(url.toString());
  }

  useEffect(() => {
    setAbiCopied(false);
  }, [viewImplementation]);

  function contractView(targetContract) {
    if (targetContract.abi) {
      return (
        <div className='contract'>
          <div className='contract-name-container'>
            <img className='contract-link' onClick={copyContractLink} src="link.svg" data-tooltip-id="my-tooltip" data-tooltip-content="Copy permalink" />
            <h2 onClick={() => setViewImplementation(false)} className={viewImplementation ? 'contract-name' : 'contract-name selected-name'} data-tooltip-id="my-tooltip" data-tooltip-content={implementationContract.abi ? "Proxy contract" : "Contract"}>{contract.name}</h2>
            {implementationContract.name && (<h2 onClick={() => setViewImplementation(true)} className={!viewImplementation ? 'contract-name' : 'contract-name selected-name'} data-tooltip-id="my-tooltip" data-tooltip-content="Implementation contract">{implementationContract.name}</h2>)}
            &nbsp;&nbsp;
            <a className='contract-action' target="_blank" href={chains.filter(chain => chain.name.includes(blockchain))[0].explorers[0].url + "/address/" + contractAddress}>
              <img className="svg" src="external-link.svg" />&nbsp;See on explorer
            </a>
            <a onClick={copyAbi} className='contract-action' data-tooltip-id="my-tooltip" data-tooltip-content="Copy ABI">
              <img className="svg" src={abiCopied ? "check.svg" : "copy.svg"} />&nbsp;ABI
            </a>
          </div>
          {/* Render buttons and input fields for each function in the ABI */}
          <div className='function-type-row'>
            <div className='function-type-container'>
              <p className='function-type-container-name'>Read</p>
              {targetContract.abi
                .filter((item) => item.type === 'function' && item.stateMutability == "view")
                .map((func) => (
                  <FunctionContainer
                    func={func}
                    result={result}
                    getUniqueFuncName={getUniqueFuncName}
                    handleInteract={handleInteract}
                    formatSolidityData={formatSolidityData}
                    viewImplementation={viewImplementation} />
                ))
              }</div>
            <div className='function-type-container'>
              <p className='function-type-container-name'>Write</p>
              {targetContract.abi
                .filter((item) => item.type === 'function' && item.stateMutability != "view")
                .map((func) => (
                  <FunctionContainer
                    func={func}
                    result={result}
                    getUniqueFuncName={getUniqueFuncName}
                    handleInteract={handleInteract}
                    formatSolidityData={formatSolidityData}
                    viewImplementation={viewImplementation} />
                ))
              }</div>
          </div>
        </div >
      );
    }
  }

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

  const supportedBlockchains = ["Ethereum", "Binance Smart Chain", "Binance Smart Chain Testnet", "Polygon", "Sepolia", "Goerli", "Hardhat Local"];

  const handleWalletConnect = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        if (window.ethereum) {
          setWalletAddress((await window.ethereum.request({ method: 'eth_requestAccounts' }))[0]);
        }
      }
      else {
        window.open("https://metamask.app.link/dapp/" + window.location.href);
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
      setStatus(switchError.message || switchError.reason);
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
    if (blockchainList) blockchainList.value = blockchain;
  }

  function submitCustomAbi(abi) {
    setContract({ abi });
  }

  async function setStatus(message) {
    window.scroll({ top: 0, left: 0, behavior: 'smooth' });
    _setStatus(message);
    var textElement = document.querySelectorAll("#status")[0];

    textElement.className = "";
    textElement.offsetWidth;
    textElement.className = "status";
  }

  const fetchAbi = async (address) => {
    try {
      const apiUrl = "https://contract-interact-node.vercel.app/fetch-abi?contractAddress=" + address + "&blockchain=" + blockchain;
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
      if (router.query.function) {
        if (router.query.function.slice(-1) == "_") {
          setViewImplementation(true);
          setFocusedFunction(router.query.function.slice(0, -1));
        } else {
          setViewImplementation(false);
          setFocusedFunction(router.query.function);
        }
      }
    }
  }, [router.isReady]);

  useEffect(() => {
    // if (addressInput) addressInput.current.focus();
  }, []);

  useEffect(() => {
    setAbiCopied(false);
    setContract({});
    setImplementationContract({});
    setResult({});
    if (contractAddress && contractAddress.length == 42 && blockchain) {
      try {
        fetchAbi(contractAddress).then((fetchedAbi) => {
          if (!fetchedAbi || fetchedAbi.ABI == null) {
            setStatus('Abi not found');
          } else {
            setContract({ abi: fetchedAbi.ABI, name: fetchedAbi.ContractName });
            if (fetchedAbi.implementation) {
              setViewImplementation(true);
              setImplementationContract({ abi: fetchedAbi.implementation.ABI, name: fetchedAbi.implementation.ContractName });
            } else {
              setViewImplementation(false);
              setImplementationContract({});
            }
          }
        });
      }
      catch (error) {
        setStatus('Abi not found');
        setContract({});
      }
    } else if (contractAddress && contractAddress.length > 4 && contractAddress.endsWith(".eth") && blockchain && window.ethereum.chainId == 1) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      provider.resolveName(contractAddress).then((address) => {
        if (address) {
          try {
            fetchAbi(address).then((fetchedAbi) => {
              if (!fetchedAbi || fetchedAbi.ABI == null) {
                setStatus('Abi not found');
              } else {
                setContract({ abi: fetchedAbi.ABI, name: fetchedAbi.ContractName });
                if (fetchedAbi.implementation) {
                  setViewImplementation(true);
                  setImplementationContract({ abi: fetchedAbi.implementation.ABI, name: fetchedAbi.implementation.ContractName });
                } else {
                  setViewImplementation(false);
                  setImplementationContract({});
                }
              }
            });
          }
          catch (error) {
            setStatus('Abi not found');
            setContract({});
          }
        }
      });
    } else if (contractAddress && contractAddress.length > 4 && contractAddress.endsWith(".eth") && blockchain && window.ethereum.chainId != 1) {
      setStatus('ENS only supported on Ethereum Mainnet (switch network on Metamask)');
      setContract({});
      setImplementationContract({});
    } else {
      setContract({});
      setImplementationContract({});
    }
    if (router.isReady) {
      if (contractAddress && focusedFunction) {
        router.push(
          {
            pathname: '/',
            query: { blockchain, contractAddress, function: focusedFunction }
          }, undefined,
          { shallow: true }
        );
      } else if (contractAddress) {
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
  }, [contractAddress, blockchain, focusedFunction]);

  const handleInteract = async (func) => {
    if (!contractAddress || !contract.abi) {
      setStatus('Please enter a valid contract address and select a blockchain');
      return;
    }

    if (window.ethereum.networkVersion != chainId) {
      await switchChain(chainId);
    }

    try {
      const values = func.inputs.map((input) => document.getElementById(func.name + "." + input.name).value);
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      var method = getUniqueFuncName(func);
      if (func.stateMutability && func.stateMutability == "view") {
        try {
          const e_contract = new ethers.Contract(contractAddress, !viewImplementation ? contract.abi : implementationContract.abi, provider);
          const response = await e_contract.functions[method](...values);
          let result_state = { ...result };
          result_state[method] = { response, type: "result" };
          setResult(result_state); // Store the result in the state
        } catch (error) {
          console.log(error);
          let result_state = { ...result };
          result_state[method] = { response: [JSON.stringify(error.reason || error)], type: "error" };
          setResult(result_state);
        }
      } else {
        if (!walletAddress) {
          let result_state = { ...result };
          result_state[method] = { response: ['Please connect your wallet first'], type: "error" };
          setResult(result_state);
          return;
        }
        // Write operation: Send a transaction and wait for it to be mined
        const e_contract = new ethers.Contract(contractAddress, !viewImplementation ? contract.abi : implementationContract.abi, signer);
        const tx = await e_contract.functions[method](...values);
        const receipt = await tx.wait();
        console.log(receipt);
        let result_state = { ...result };
        result_state[method] = { response: ["Transaction successful: " + receipt.transactionHash], type: "result" };
        setResult(result_state); // Store the result in the state
      }
    } catch (error) {
      console.log(error);
      let result_state = { ...result };
      result_state[method] = { response: [JSON.stringify(error.reason || error.message)], type: "error" };
      setResult(result_state);
    }
  };

  function redirectToContract() {
    setFocusedFunction(null);
  }

  return (
    <div>
      <Head>
        <title>{contract.name ? "Interact - " + contract.name : "Contract Interact"}</title>
      </Head>

      <main>
        {focusedFunction == null && <>
          <p className='header'>Input any valid contract address (or ENS domain) below and select the target blockchain to start interacting with the contract. If ABI has not yet been published by the author, or the target blockchain is Other, you must provide your own ABI.</p>
          <div className='walletAddressContainer'>
            {walletAddress ? (
              <p onClick={copyWallet}><img className="svg" src={walletCopied ? "check.svg" : "copy.svg"} />&nbsp;{walletAddress}</p>
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
            <button className='abiButton' onClick={() => setAbiModal(true)} data-tooltip-id="my-tooltip"
              data-tooltip-content="Add your own ABI">+ABI</button>
          </div>
          <h4 id="status" className='status'>{status}</h4>
          {contract.abi && !viewImplementation ? contractView(contract) : contractView(implementationContract)}
        </>}

        {focusedFunction != null && contract.abi && <>
          <div className='walletAddressContainer'>
            {walletAddress ? (
              <p onClick={copyWallet}><img className="svg" src={walletCopied ? "check.svg" : "copy.svg"} />&nbsp;{walletAddress}</p>
            ) : (
              <button onClick={handleWalletConnect} >Connect your wallet</button>
            )}
          </div>
          <br />
          <br />
          <div className='function-type-row'>
            <div className='function-type-container'>
              {viewImplementation && implementationContract.abi
                .filter((item) => item.type === 'function' && getUniqueFuncName(item) == focusedFunction)
                .map((func) => (
                  <FunctionContainer
                    func={func}
                    result={result}
                    getUniqueFuncName={getUniqueFuncName}
                    handleInteract={handleInteract}
                    formatSolidityData={formatSolidityData}
                    viewImplementation={true}
                  />
                ))}
              {!viewImplementation && contract.abi
                .filter((item) => item.type === 'function' && getUniqueFuncName(item) == focusedFunction)
                .map((func) => (
                  <FunctionContainer
                    func={func}
                    result={result}
                    getUniqueFuncName={getUniqueFuncName}
                    handleInteract={handleInteract}
                    formatSolidityData={formatSolidityData}
                    viewImplementation={false}
                  />
                ))}
            </div>
          </div>
          <br />
          <br />
          <p>Interacting with <b>{focusedFunction}</b> of <b>{contract.name}</b> on <b>{blockchain}</b></p>
          <div className='contract-name-container'>
            <p className='contract-detail'
              data-tooltip-id="my-tooltip"
              data-tooltip-content="Blockchain">{blockchain}</p>

            <p
              className='contract-detail'
              style={{ cursor: "pointer" }}
              data-tooltip-id="my-tooltip"
              data-tooltip-content="Contract address"
              onClick={redirectToContract}>
              <img className="svg" src="external-link.svg" />&nbsp;
              {contractAddress}</p>
            {/* <a className='contract-action' target="_blank" href={chains.filter(chain => chain.name.includes(blockchain))[0].explorers[0].url + "/address/" + contractAddress}>See on explorer</a> */}
          </div>
        </>}
        <Tooltip style={{ padding: "7px 11px", borderRadius: "10px", fontSize: "0.8rem" }} className='no' delayShow={300} id="my-tooltip" />
        <footer>Made by @kkayam, no data is saved, <a href='https://github.com/kkayam/contract-interact'>Github</a>, <a href='https://github.com/kkayam/contract-interact/issues'>Request feature</a>. Powered by Etherscan, BSCScan, Polygonscan.</footer>
      </main >
    </div >
  );
};
