import React, { useState, useEffect } from 'react';
import { Loader } from './components/Loader';
import { LandingPage } from './views/LandingPage';
import { Dashboard } from './views/Dashboard';
import { CaseDetail } from './views/CaseDetail';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState('landing');
  const [currentId, setCurrentId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleNavigate = (view: string, id?: string) => {
    window.scrollTo(0, 0);
    setCurrentView(view);
    setCurrentId(id);
  };

  return (
    <div className="min-h-screen bg-background text-white font-sans selection:bg-white selection:text-black">
      {isLoading ? (
        <Loader onFinish={() => setIsLoading(false)} />
      ) : (
        <>
          {currentView === 'landing' && <LandingPage onEnterApp={() => handleNavigate('dashboard')} />}
          {currentView === 'dashboard' && <Dashboard onLogout={() => handleNavigate('landing')} onNavigate={handleNavigate} />}
          {currentView === 'create_case' && <CaseDetail onNavigate={handleNavigate} />}
          {currentView === 'case_detail' && <CaseDetail caseId={currentId} onNavigate={handleNavigate} />}
        </>
      )}
    </div>
  );
}