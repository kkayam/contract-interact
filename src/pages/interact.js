import Head from 'next/head';
import { useState } from 'react';
import { interactWithContract } from '../lib/contract';

export default function Interact() {
    const [address, setAddress] = useState('');
    const [abi, setAbi] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            await interactWithContract(address, abi);
        } catch (error) {
            console.error('Error interacting with contract:', error);
        }
    };

    return (
        <div>
            <Head>
                <title>Interact with a Smart Contract</title>
            </Head>

            <main>
                <h1>Interact with a Smart Contract</h1>
                <form onSubmit={handleSubmit}>
                    <label>
                        Contract Address:
                        <input
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                        />
                    </label>
                    <label>
                        Contract ABI:
                        <textarea
                            value={abi}
                            onChange={(e) => setAbi(e.target.value)}
                        ></textarea>
                    </label>
                    <button type="submit">Interact</button>
                </form>
            </main>
        </div>
    );
}
