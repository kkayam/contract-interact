import Head from 'next/head';
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
const chains = require('../../public/chains.json');
import SearchModal from '../components/SearchModal';
import JsonInputModal from '../components/JsonInputModal';

window.isMobile = function () {
  let check = false;
  (function (a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window.opera);
  return check;
};

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
      const regex = /\b\w{66}\b/g;
      return value.replace(regex, (match) => `<a target=”_blank” href="${chains.filter(chain => chain.name.includes(blockchain))[0].explorers[0].url + "/tx/" + match}">${match}</a>`);
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
      } else if (window.isMobile()) {
        window.open("https://metamask.app.link/dapp/www.contractinteract.com/");
      }
      else {
        setStatus('Ethereum provider not found');
        throw new Error('Ethereum provider not found');
      }
    } catch (error) {
      setStatus('Error connecting wallet:', error);
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
    if (contractAddress && contractAddress.length == 42 && blockchain) {
      try {
        fetchAbi().then((fetchedAbi) => {
          setAbi(fetchedAbi);
          if (fetchedAbi == null) {
            setStatus('Abi not found');
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
      setStatus(JSON.stringify(error.reason || error));
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
                    {result[getUniqueFuncName(func)] &&
                      result[getUniqueFuncName(func)].map((r) => <p dangerouslySetInnerHTML={{ __html: formatSolidityData(r) }}></p>)}
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
