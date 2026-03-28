import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Shield, Trophy, Gift, Flame } from 'lucide-react';
import SVGForgeLayer from '../components/SVGForgeLayer';

type View = 'home' | 'admin' | 'user' | 'trophy';

interface HomePageProps {
  onNavigate: (view: View) => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {
  const { identity, login, loginStatus } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const handleGetStarted = async () => {
    if (isAuthenticated) {
      onNavigate('user');
    } else {
      try {
        await login();
      } catch (error) {
        console.error('Login error:', error);
      }
    }
  };

  return (
    <div className="relative">
      {/* Video Background */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          poster="/assets/Video.gif"
        >
          <source src="/assets/Bonsai Burn.mp4" type="video/mp4" />
          {/* Fallback to GIF if video doesn't load */}
          <img
            src="/assets/Video.gif"
            alt="Bonsai Burn Background"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </video>
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* SVG Forge Layer on top of video */}
      <div className="relative z-[1]">
        <SVGForgeLayer variant="hero" />
      </div>
      
      <div className="container mx-auto px-4 py-12 relative z-10">
        {/* Hero Section */}
        <section className="text-center mb-16 animate-glow-entrance">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8 flex justify-center">
              <div className="relative">
                <img
                  src="/assets/bonsai gold flames.png"
                  alt="Bonsai NFT Collection"
                  className="rounded-2xl shadow-2xl max-w-full h-auto animate-ember-float"
                  style={{ maxHeight: '400px' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/40 via-transparent to-transparent rounded-2xl pointer-events-none" />
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-gold-gradient animate-shimmer-wave drop-shadow-2xl">
              Bonsai NFT Product Redemption
            </h1>
            <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-2xl mx-auto drop-shadow-lg">
              Collect unique Bonsai NFTs forged in the eternal flame and redeem them for exclusive discount codes and products. 
              Join our community and grow your digital garden.
            </p>
            <Button
              size="lg"
              onClick={handleGetStarted}
              disabled={loginStatus === 'logging-in'}
              className="text-lg px-8 py-6 gap-2 ember-glow animate-gold-pulse"
            >
              <Flame className="h-5 w-5 animate-flicker" />
              {isAuthenticated ? 'View My Collection' : 'Get Started'}
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-gold-gradient drop-shadow-lg">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-2 border-primary/20 hover:border-primary transition-all card-fiery-hover animate-glow-entrance bg-background/80 backdrop-blur-sm" style={{ animationDelay: '0.1s' }}>
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mb-4 animate-gold-pulse">
                  <Gift className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Collect NFTs</h3>
                <p className="text-muted-foreground">
                  Receive unique Bonsai NFTs forged in molten flames from admins. Each NFT represents a special product or discount opportunity.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-accent/20 hover:border-accent transition-all card-fiery-hover animate-glow-entrance bg-background/80 backdrop-blur-sm" style={{ animationDelay: '0.2s' }}>
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center mb-4 animate-gold-pulse">
                  <Flame className="h-6 w-6 text-accent animate-flicker" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Redeem Rewards</h3>
                <p className="text-muted-foreground">
                  Burn your NFTs in the eternal forge to permanently unlock discount codes and exclusive product access.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-chart-1/20 hover:border-chart-1 transition-all card-fiery-hover animate-glow-entrance bg-background/80 backdrop-blur-sm" style={{ animationDelay: '0.3s' }}>
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-full bg-chart-1/20 flex items-center justify-center mb-4 animate-gold-pulse">
                  <Trophy className="h-6 w-6 text-chart-1" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Climb Leaderboard</h3>
                <p className="text-muted-foreground">
                  Compete with other collectors and showcase your achievements in the 3D Trophy Room with glowing forge effects.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center bg-gradient-to-br from-primary/20 via-accent/20 to-primary/20 backdrop-blur-md rounded-2xl p-12 border border-primary/30 card-fiery-hover animate-glow-entrance" style={{ animationDelay: '0.4s' }}>
          <div className="relative">
            <Shield className="h-16 w-16 text-primary mx-auto mb-4 animate-ember-float" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-20 w-20 bg-primary/20 blur-2xl rounded-full animate-gold-pulse" />
            </div>
          </div>
          <h2 className="text-3xl font-bold mb-4 text-gold-gradient drop-shadow-lg">Secured by Internet Identity</h2>
          <p className="text-lg text-white/90 mb-6 max-w-2xl mx-auto drop-shadow-md">
            Your NFTs are stored on the Internet Computer blockchain with enterprise-grade security. 
            Login with Internet Identity for a seamless and secure experience.
          </p>
          {!isAuthenticated && (
            <Button size="lg" onClick={handleGetStarted} disabled={loginStatus === 'logging-in'} className="ember-glow">
              {loginStatus === 'logging-in' ? 'Connecting...' : 'Login Now'}
            </Button>
          )}
        </section>
      </div>
    </div>
  );
}
