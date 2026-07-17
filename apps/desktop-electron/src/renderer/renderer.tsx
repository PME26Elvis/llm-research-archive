import './style.css';
import { createRoot } from 'react-dom/client';
import { ObservatoryApp } from './observatory-app';
import { PreferencesProvider } from './preferences-context';

createRoot(document.getElementById('root')!).render(
  <PreferencesProvider>
    <ObservatoryApp implementation="classic" />
  </PreferencesProvider>,
);
