import React from 'react';

const Table = ({ children }) => {
    return (
        <div className="table-surface">
            {/* Table Border/Frame - Scaled for mobile */}
            <div className="table-border-frame"></div>

            {/* Interaction Layer */}
            <div id="table-interaction-layer" className="table-interaction-layer">
                {children}
            </div>

            {/* Ambient Lighting */}
            <div className="table-ambient-light"></div>
        </div>
    );
};

export default Table;
