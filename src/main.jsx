import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { CityProvider } from './stocks/CityContext';
import { I18nProvider } from './i18n/I18nContext';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <I18nProvider>
      <CityProvider>
        <App />
      </CityProvider>
    </I18nProvider>
  </StrictMode>
);
