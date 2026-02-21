import { useState } from 'react';
import { useSaveCallerUserProfile } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles, AlertCircle } from 'lucide-react';

export default function ProfileSetupModal() {
  const [displayName, setDisplayName] = useState('');
  const { mutate: saveProfile, isPending, isError, error } = useSaveCallerUserProfile();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (displayName.trim()) {
      saveProfile({ 
        displayName: displayName.trim(),
        bio: '',
        profileImage: undefined,
        forgeTheme: 'default'
      });
    }
  };

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md border-primary/20" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center animate-gold-pulse">
              <Sparkles className="h-8 w-8 text-primary animate-flicker" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">Welcome to Bonsai NFT</DialogTitle>
          <DialogDescription className="text-center">
            Please enter your display name to complete your profile setup
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {isError && (
            <Alert variant="destructive" className="border-destructive/50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error?.message?.includes('wait') 
                  ? 'Your account is being initialized. Please wait a moment and try again.'
                  : 'Failed to save profile. Please try again.'}
              </AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              placeholder="Enter your display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={isPending}
              autoFocus
              className="border-primary/20"
            />
          </div>
          <Button type="submit" className="w-full ember-glow" disabled={!displayName.trim() || isPending}>
            {isPending ? 'Saving Profile...' : 'Continue'}
          </Button>
          {isPending && (
            <p className="text-xs text-center text-muted-foreground">
              Setting up your account...
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
