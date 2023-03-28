import React, { useState, useEffect, useCallback } from 'react';

const JsonInputModal = ({ isOpen, onSubmit, onClose }) => {
    const [jsonString, setJsonString] = useState('');
    const KEY_NAME_ESC = 'Escape';
    const KEY_EVENT_TYPE = 'keyup';

    const handleSubmit = () => {
        try {
            const parsedJson = JSON.parse(jsonString);
            onSubmit(parsedJson);
            setJsonString('');
            onClose();
        } catch (error) {
            alert('Invalid JSON format. Please check your input.');
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

    return isOpen ? (
        <div
            className="modal-overlay"
            onClick={onClose}
        >
            <div
                className="modal json-input-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <textarea
                    className="json-textarea"
                    placeholder="Enter JSON string..."
                    value={jsonString}
                    onChange={(e) => setJsonString(e.target.value)}
                />
                <button onClick={handleSubmit}>Submit</button>
            </div>
        </div>
    ) : null;
};

export default JsonInputModal;