import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import { useActor } from './hooks/useActor';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import Header from './components/Header';
import Footer from './components/Footer';
import ProfileSetupModal from './components/ProfileSetupModal';
import ForgeBackground from './components/ForgeBackground';
import HomePage from './pages/HomePage';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import TrophyRoom from './pages/TrophyRoom';
import { useState, useEffect } from 'react';

type View = 'home' | 'admin' | 'user' | 'trophy';

export default function App() {
  const { identity, loginStatus, isInitializing } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const [currentView, setCurrentView] = useState<View>('home');

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();
  
  // Only show profile setup when:
  // 1. User is authenticated (with non-anonymous identity)
  // 2. Login process is complete (not initializing or logging in)
  // 3. Actor is ready (not fetching)
  // 4. Profile query has completed (isFetched)
  // 5. Profile is null (doesn't exist)
  const showProfileSetup = 
    isAuthenticated && 
    !isInitializing && 
    loginStatus !== 'logging-in' &&
    !actorFetching && 
    !profileLoading && 
    isFetched && 
    userProfile === null;

  // Navigate to home when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      setCurrentView('home');
    }
  }, [isAuthenticated]);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
        <ForgeBackground intensity={currentView === 'home' ? 'high' : 'medium'} />
        
        <div className="relative z-10">
          <Header currentView={currentView} onNavigate={setCurrentView} />
          
          <main className="flex-1">
            {currentView === 'home' && <HomePage onNavigate={setCurrentView} />}
            {currentView === 'admin' && <AdminDashboard />}
            {currentView === 'user' && <UserDashboard onNavigate={setCurrentView} />}
            {currentView === 'trophy' && <TrophyRoom />}
          </main>

          <Footer />
        </div>
        
        {showProfileSetup && <ProfileSetupModal />}
        <Toaster />
      </div>
    </ThemeProvider>
  );
}
