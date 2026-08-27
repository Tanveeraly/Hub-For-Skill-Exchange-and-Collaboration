import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Provider } from 'react-redux';
import { store } from './store/store.ts';
import { setAutoFreeze } from 'immer';

// Disable Immer auto-freeze to prevent "read only property" errors with framer-motion and recharts
setAutoFreeze(false);

const clientId = "176538480867-asvgn31fnv0vcqnf67re3va8ld37k752.apps.googleusercontent.com";

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
  <Provider store={store}>
    <GoogleOAuthProvider clientId={clientId}>
      <App />
    </GoogleOAuthProvider>
  </Provider>
  // </StrictMode>
);
