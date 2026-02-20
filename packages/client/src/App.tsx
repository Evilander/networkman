import { useState, useCallback } from 'react';
import { Dashboard } from './pages/Dashboard';
import { TitleScreen } from './components/shared/TitleScreen';

export function App() {
  const [showTitle, setShowTitle] = useState(true);

  const dismiss = useCallback(() => setShowTitle(false), []);

  return (
    <>
      {showTitle && <TitleScreen onDismiss={dismiss} />}
      <Dashboard />
    </>
  );
}
