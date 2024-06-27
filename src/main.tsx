import React from 'react';
import ReactDOM from 'react-dom/client';
import AgoraRTC, { AgoraRTCProvider } from "agora-rtc-react";
import App from './App.tsx';

const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AgoraRTCProvider client={client}>
      <App />
    </AgoraRTCProvider>
  </React.StrictMode>,
)
