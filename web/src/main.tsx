import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './auth/AuthContext';
import { ProcedureSheetProvider } from './components/ProcedureSheet';
import { ToastProvider } from './components';
import { I18nProvider } from './i18n';
import { ThemeProvider } from './theme/ThemeContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <I18nProvider>
        <BrowserRouter>
          <AuthProvider>
            <ToastProvider>
              <ProcedureSheetProvider>
                <App />
              </ProcedureSheetProvider>
            </ToastProvider>
          </AuthProvider>
        </BrowserRouter>
      </I18nProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
