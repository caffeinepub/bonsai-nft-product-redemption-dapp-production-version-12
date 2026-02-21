import { Flame } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/60 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-primary animate-flicker" />
            <span className="font-medium text-foreground">Powered by T3kNo-Logic RWA Technology</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
