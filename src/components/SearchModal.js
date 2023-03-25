import React, { useState } from 'react';
import Fuse from 'fuse.js';

const chains = require('../../public/chains.json').map(chain => chain.name);

const fuse = new Fuse(chains, { includeScore: true, threshold: 0.3 });

const SearchModal = ({ isOpen, onSelect, onClose }) => {
    const [searchText, setSearchText] = useState('');
    const [results, setResults] = useState([]);

    const handleSearch = (event) => {
        const query = event.target.value;
        setSearchText(query);

        if (query) {
            const newResults = fuse.search(query).slice(0, 10);
            setResults(newResults);
        } else {
            setResults([]);
        }
    };

    const handleSelect = (name) => {
        setSearchText('');
        setResults([]);
        onSelect(name);
        onClose();
    };

    return isOpen ? (
        <div
            className="modal-overlay"
            onClick={onClose}
        >
            <div
                className="modal"
                onClick={(e) => e.stopPropagation()}
            >
                <input
                    type="text"
                    className="main"
                    placeholder="Search..."
                    value={searchText}
                    onChange={handleSearch}
                />
                <ul className="results-list">
                    {results.map(({ item, refIndex }) => (
                        <li
                            key={refIndex}
                            onClick={() => handleSelect(item)}
                            className="result-item"
                        >
                            {item}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    ) : null;
};


export default SearchModal;
