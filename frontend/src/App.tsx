import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/LandingPage';
import { PlaygroundPage } from './pages/PlaygroundPage';

type ViewState = 'landing' | 'playground';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('landing');

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Global Background Elements */}
      <div className="fixed inset-0 bg-[#0f172a] -z-20"></div>
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay -z-10 pointer-events-none"></div>
      
      <Navbar currentView={currentView} onViewChange={setCurrentView} />
      
      <main className="flex-1 flex flex-col relative w-full">
        {currentView === 'landing' ? (
          <LandingPage onNavigateToPlayground={() => setCurrentView('playground')} />
        ) : (
          <PlaygroundPage />
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;
