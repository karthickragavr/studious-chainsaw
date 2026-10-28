import React from 'react';
import ReactDOM from 'react-dom/client';
import ArcadeApp from './ArcadeApp';
import '../src/index.css';
import './arcade.css';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ArcadeApp />
    </React.StrictMode>,
);
