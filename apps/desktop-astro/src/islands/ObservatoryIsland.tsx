import '../../../desktop-electron/src/renderer/style.css';
import '../styles/astro-shell.css';
import { ObservatoryApp } from '../../../desktop-electron/src/renderer/observatory-app';
import { PreferencesProvider } from '../../../desktop-electron/src/renderer/preferences-context';

export default function ObservatoryIsland() {
  return (
    <PreferencesProvider>
      <ObservatoryApp implementation="astro" />
    </PreferencesProvider>
  );
}
