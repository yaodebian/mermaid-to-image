import React from 'react';
import ReactDOM from 'react-dom/client';
import Popup from './Popup';
import '../styles/tailwind.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
); 