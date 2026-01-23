import React, { useState, useEffect } from 'react';
import { Loader } from './components/Loader';
import { LandingPage } from './views/LandingPage';
import { Dashboard } from './views/Dashboard';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'landing' | 'app'>('landing');

  useEffect(() => {
    // Simulate initial asset loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleEnterApp = () => {
    window.scrollTo(0, 0);
    setCurrentView('app');
  };

  const handleGoHome = () => {
    window.scrollTo(0, 0);
    setCurrentView('landing');
  };

  return (
    <div className="min-h-screen bg-background text-white font-sans selection:bg-white selection:text-black">
      {isLoading ? (
        <Loader onFinish={() => setIsLoading(false)} />
      ) : (
        <>
          {currentView === 'landing' && <LandingPage onEnterApp={handleEnterApp} />}
          {currentView === 'app' && <Dashboard onLogout={handleGoHome} />}
        </>
      )}
    </div>
  );
}