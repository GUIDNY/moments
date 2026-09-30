import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { VisitProvider } from './portfolio/VisitContext';
import { I18nProvider } from './i18n/I18nContext';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <I18nProvider>
      <VisitProvider>
        <App />
      </VisitProvider>
    </I18nProvider>
  </StrictMode>
);
