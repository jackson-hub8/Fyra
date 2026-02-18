/// file: main.tsx
/// Jackson Hurley, Kaitlyn Maes, Cam Horine
/// App entry point.
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { EventsProvider } from './context/EventsContext';
import './index.css';

function getPlatform(): 'windows' | 'mac' | 'ios' | 'android' | '' {
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return 'android';
  if (/iPad|iPhone|iPod/i.test(ua)) return 'ios';
  if (/Mac/i.test(ua)) return 'mac';
  if (/Windows/i.test(ua)) return 'windows';
  return '';
}
const platform = getPlatform();
if (platform) document.documentElement.dataset.platform = platform;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <EventsProvider>
        <App />
      </EventsProvider>
    </AuthProvider>
  </React.StrictMode>
);
