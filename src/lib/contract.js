import { ethers } from 'ethers';
import { getProvider, getSigner } from './wallet';

export async function interactWithContract(address, abi) {
    try {
        const provider = getProvider();
        const signer = getSigner();

        if (!provider || !signer) {
            throw new Error('Wallet not connected');
        }

        const contractAddress = ethers.utils.getAddress(address);
        const contractAbi = JSON.parse(abi);
        const contract = new ethers.Contract(contractAddress, contractAbi, signer);

        // Example interaction: Read a public variable named 'value' from the contract
        const value = await contract.value();
        console.log('Contract value:', value.toString());

        // Example interaction: Call a function named 'setValue' with an argument
        const newValue = 42;
        const transaction = await contract.setValue(newValue);
        console.log('Transaction:', transaction);

        // Wait for the transaction to be mined
        const receipt = await transaction.wait();
        console.log('Transaction receipt:', receipt);

        return receipt;
    } catch (error) {
        console.error('Error interacting with contract:', error);
        throw error;
    }
}
