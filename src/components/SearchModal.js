import React, { useState, useEffect, useCallback } from 'react';
import Fuse from 'fuse.js';

const chains = require('../../public/chains.json').map(chain => chain.name);

const fuse = new Fuse(chains, { includeScore: true, threshold: 0.3 });

const SearchModal = ({ isOpen, onSelect, onClose }) => {
    const [searchText, setSearchText] = useState('');
    const [results, setResults] = useState([]); const KEY_NAME_ESC = 'Escape';
    const KEY_EVENT_TYPE = 'keyup';

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

    const handleEscKey = useCallback((event) => {
        if (event.key === KEY_NAME_ESC) {
            onClose();
        }
    }, [onClose]);

    useEffect(() => {
        document.addEventListener(KEY_EVENT_TYPE, handleEscKey, false);

        return () => {
            document.removeEventListener(KEY_EVENT_TYPE, handleEscKey, false);
        };
    }, [handleEscKey]);

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
                    className="main modalinput"
                    width="100%"
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
