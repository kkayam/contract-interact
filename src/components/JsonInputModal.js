import React, { useState } from 'react';

const JsonInputModal = ({ isOpen, onSubmit, onClose }) => {
    const [jsonString, setJsonString] = useState('');

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