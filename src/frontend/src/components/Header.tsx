import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useIsCallerAdmin } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { Menu, X, Sparkles, Shield, User, Home, Trophy } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import AmbientSound from './AmbientSound';
import { toast } from 'sonner';

type View = 'home' | 'admin' | 'user' | 'trophy';

interface HeaderProps {
  currentView: View;
  onNavigate: (view: View) => void;
}

export default function Header({ currentView, onNavigate }: HeaderProps) {
  const { login, clear, loginStatus, identity, isInitializing, isLoginError, loginError } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: isAdmin } = useIsCallerAdmin();
  const queryClient = useQueryClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();
  const disabled = loginStatus === 'logging-in' || isInitializing;

  const handleAuth = async () => {
    if (isAuthenticated) {
      // Logout
      await clear();
      queryClient.clear();
      onNavigate('home');
      toast.success('Logged out successfully');
    } else {
      // Login
      if (isInitializing) {
        toast.error('Please wait, authentication is initializing...');
        return;
      }
      
      try {
        login();
        // Don't show error here, let the login process handle it
      } catch (error: any) {
        console.error('Login error:', error);
        toast.error('Failed to initiate login. Please try again.');
      }
    }
  };

  // Show error toast when login fails
  useEffect(() => {
    if (isLoginError && loginError) {
      toast.error(loginError.message || 'Login failed. Please try again.');
    }
  }, [isLoginError, loginError]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const getButtonText = () => {
    if (isInitializing) return 'Initializing...';
    if (loginStatus === 'logging-in') return 'Connecting...';
    if (isAuthenticated) return 'Logout';
    return 'Connect ID Wallet';
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity group"
          >
            <div className="relative">
              <img 
                src="/assets/bonsai gold flames.png" 
                alt="Bonsai NFT" 
                className="h-10 w-10 object-contain animate-ember-float" 
              />
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-gold-pulse" />
            </div>
            <span className="font-bold text-xl hidden sm:inline-block text-gold-gradient">
              Bonsai NFT
            </span>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-2">
            <Button
              variant={currentView === 'home' ? 'default' : 'ghost'}
              onClick={() => onNavigate('home')}
              className="gap-2"
            >
              <Home className="h-4 w-4" />
              Home
            </Button>

            {isAuthenticated && (
              <>
                <Button
                  variant={currentView === 'user' ? 'default' : 'ghost'}
                  onClick={() => onNavigate('user')}
                  className="gap-2"
                >
                  <User className="h-4 w-4" />
                  My NFTs
                </Button>

                <Button
                  variant={currentView === 'trophy' ? 'default' : 'ghost'}
                  onClick={() => onNavigate('trophy')}
                  className="gap-2"
                >
                  <Trophy className="h-4 w-4" />
                  Trophy Room
                </Button>

                {isAdmin && (
                  <Button
                    variant={currentView === 'admin' ? 'default' : 'ghost'}
                    onClick={() => onNavigate('admin')}
                    className="gap-2"
                  >
                    <Shield className="h-4 w-4" />
                    Admin
                  </Button>
                )}
              </>
            )}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-2">
            <AmbientSound />
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="hidden sm:inline-flex"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {isAuthenticated && userProfile && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-sm border border-primary/20 animate-gold-pulse">
                <Sparkles className="h-4 w-4 text-primary animate-flicker" />
                <span className="font-medium">{userProfile.displayName}</span>
              </div>
            )}

            <Button
              onClick={handleAuth}
              disabled={disabled}
              variant={isAuthenticated ? 'outline' : 'default'}
              className="hidden sm:inline-flex ember-glow"
            >
              {getButtonText()}
            </Button>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2 border-t border-border/40 animate-glow-entrance">
            <Button
              variant={currentView === 'home' ? 'default' : 'ghost'}
              onClick={() => {
                onNavigate('home');
                setMobileMenuOpen(false);
              }}
              className="w-full justify-start gap-2"
            >
              <Home className="h-4 w-4" />
              Home
            </Button>

            {isAuthenticated && (
              <>
                <Button
                  variant={currentView === 'user' ? 'default' : 'ghost'}
                  onClick={() => {
                    onNavigate('user');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full justify-start gap-2"
                >
                  <User className="h-4 w-4" />
                  My NFTs
                </Button>

                <Button
                  variant={currentView === 'trophy' ? 'default' : 'ghost'}
                  onClick={() => {
                    onNavigate('trophy');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full justify-start gap-2"
                >
                  <Trophy className="h-4 w-4" />
                  Trophy Room
                </Button>

                {isAdmin && (
                  <Button
                    variant={currentView === 'admin' ? 'default' : 'ghost'}
                    onClick={() => {
                      onNavigate('admin');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full justify-start gap-2"
                  >
                    <Shield className="h-4 w-4" />
                    Admin Dashboard
                  </Button>
                )}

                {userProfile && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-sm border border-primary/20">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="font-medium">{userProfile.displayName}</span>
                  </div>
                )}
              </>
            )}

            <Button
              onClick={handleAuth}
              disabled={disabled}
              variant={isAuthenticated ? 'outline' : 'default'}
              className="w-full"
            >
              {getButtonText()}
            </Button>

            <Button
              variant="ghost"
              onClick={toggleTheme}
              className="w-full justify-start gap-2"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
