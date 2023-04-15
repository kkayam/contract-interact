import React from 'react';

const FunctionContainer = ({ func, result, getUniqueFuncName, handleInteract, formatSolidityData, viewImplementation }) => {
    function copyFunctionLink() {
        let url = window.location.href + "&function=" + getUniqueFuncName(func) + (viewImplementation ? "_" : "");
        navigator.clipboard.writeText(url);
    }
    return <div className="function-container" key={getUniqueFuncName(func)}>
        <div className="function-row">
            <div className='function-title'>
                <img onClick={copyFunctionLink} height="15px" src="link.svg" className='link' />
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
                (result[getUniqueFuncName(func)].type == "result") ?
                result[getUniqueFuncName(func)].response.map((r, i) => <p dangerouslySetInnerHTML={{ __html: ((func.outputs[i] && func.outputs[i].name) ? func.outputs[i].name + " " : "") + formatSolidityData(r) }}></p>) : ""}

            {result[getUniqueFuncName(func)] && (result[getUniqueFuncName(func)].type == "error") ?
                result[getUniqueFuncName(func)].response.map((r, i) => <p className='status'>{r}</p>) : ""}
        </div>
    </div>;
};

export default FunctionContainer;