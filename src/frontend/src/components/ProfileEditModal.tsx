import { useState, useRef, useEffect } from 'react';
import { useSaveCallerUserProfile, useGetCallerUserProfile } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Upload, X, Flame, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ExternalBlob } from '../backend';
import type { UserProfile } from '../backend';

interface ProfileEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProfileEditModal({ open, onOpenChange }: ProfileEditModalProps) {
  const { data: currentProfile } = useGetCallerUserProfile();
  const { mutate: saveProfile, isPending, isError, error } = useSaveCallerUserProfile();
  
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [forgeTheme, setForgeTheme] = useState('default');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFilePreview, setUploadedFilePreview] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update form when profile loads
  useEffect(() => {
    if (currentProfile) {
      setDisplayName(currentProfile.displayName || '');
      setBio(currentProfile.bio || '');
      setForgeTheme(currentProfile.forgeTheme || 'default');
    }
  }, [currentProfile]);

  const currentImageUrl = currentProfile?.profileImage?.getDirectURL();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload PNG, JPG, GIF, or WEBP files only.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    if (file.size > maxSize) {
      toast.error('File size exceeds 10MB. Please upload a smaller file.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setIsProcessingFile(true);

    try {
      // Create preview using FileReader for data URL
      const previewReader = new FileReader();
      previewReader.onload = () => {
        setUploadedFilePreview(previewReader.result as string);
        setUploadedFile(file);
        setIsProcessingFile(false);
      };
      previewReader.onerror = () => {
        toast.error('Failed to read file. Please try again.');
        setIsProcessingFile(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      };
      previewReader.readAsDataURL(file);
    } catch (err) {
      console.error('Error processing file:', err);
      toast.error('Failed to process file. Please try again.');
      setIsProcessingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeUploadedFile = () => {
    setUploadedFile(null);
    setUploadedFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!displayName.trim()) {
      toast.error('Display name is required');
      return;
    }

    try {
      let profileImageBlob: ExternalBlob | undefined = currentProfile?.profileImage;
      
      // If user uploaded a new file, convert it to ExternalBlob
      if (uploadedFile) {
        setIsProcessingFile(true);
        
        try {
          // Read file as ArrayBuffer using FileReader
          const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              if (reader.result instanceof ArrayBuffer) {
                resolve(reader.result);
              } else {
                reject(new Error('Failed to read file as ArrayBuffer'));
              }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsArrayBuffer(uploadedFile);
          });

          // Convert ArrayBuffer to Uint8Array
          const uint8Array = new Uint8Array(arrayBuffer);
          
          // Create ExternalBlob from bytes
          profileImageBlob = ExternalBlob.fromBytes(uint8Array);
          
          setIsProcessingFile(false);
        } catch (fileError) {
          setIsProcessingFile(false);
          console.error('Error converting file:', fileError);
          toast.error('Failed to process image file. Please try again.');
          return;
        }
      }

      const profile: UserProfile = {
        displayName: displayName.trim(),
        bio: bio.trim(),
        profileImage: profileImageBlob,
        forgeTheme,
      };

      saveProfile(profile, {
        onSuccess: () => {
          toast.success('Profile saved successfully!');
          onOpenChange(false);
          setUploadedFile(null);
          setUploadedFilePreview(null);
        },
        onError: (err) => {
          console.error('Profile save error:', err);
        },
      });
    } catch (err) {
      setIsProcessingFile(false);
      console.error('Error in profile submission:', err);
      toast.error('Failed to save profile. Please try again.');
    }
  };

  const isSubmitDisabled = isPending || isProcessingFile || !displayName.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg border-primary/20 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-primary animate-flicker" />
            Edit Profile
          </DialogTitle>
          <DialogDescription>
            Customize your profile with display name, bio, image, and forge theme
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {isError && (
            <Alert variant="destructive" className="border-destructive/50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error?.message?.includes('wait') || error?.message?.includes('Unauthorized') || error?.message?.includes('guest')
                  ? 'Please wait a moment and try again. Your account is being initialized.'
                  : error?.message?.includes('Anonymous')
                  ? 'Please log in to save your profile.'
                  : 'Failed to save profile. Please try again.'}
              </AlertDescription>
            </Alert>
          )}
          
          {/* Profile Image */}
          <div className="space-y-3">
            <Label>Profile Image</Label>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 border-2 border-primary/50">
                <AvatarImage src={uploadedFilePreview || currentImageUrl} />
                <AvatarFallback className="bg-primary/10">
                  <User className="h-10 w-10 text-primary" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isProcessingFile || isPending}
                />
                {!uploadedFilePreview ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 border-primary/50 hover:border-primary ember-glow"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessingFile || isPending}
                  >
                    {isProcessingFile ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Upload Image
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={removeUploadedFile}
                    disabled={isProcessingFile || isPending}
                  >
                    <X className="h-4 w-4" />
                    Remove Image
                  </Button>
                )}
                <p className="text-xs text-muted-foreground">PNG, JPG, GIF, WEBP • Max 10MB</p>
              </div>
            </div>
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name *</Label>
            <Input
              id="displayName"
              placeholder="Your display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="border-primary/20"
              required
              disabled={isPending || isProcessingFile}
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="border-primary/20 min-h-[100px]"
              maxLength={500}
              disabled={isPending || isProcessingFile}
            />
            <p className="text-xs text-muted-foreground text-right">{bio.length}/500</p>
          </div>

          {/* Forge Theme */}
          <div className="space-y-2">
            <Label htmlFor="forgeTheme">Forge Color Theme</Label>
            <Select value={forgeTheme} onValueChange={setForgeTheme} disabled={isPending || isProcessingFile}>
              <SelectTrigger id="forgeTheme" className="border-primary/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default (Molten Orange)</SelectItem>
                <SelectItem value="crimson">Crimson Forge</SelectItem>
                <SelectItem value="azure">Azure Flame</SelectItem>
                <SelectItem value="emerald">Emerald Fire</SelectItem>
                <SelectItem value="gold">Golden Blaze</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Choose your preferred forge color theme</p>
          </div>
        </form>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={isPending || isProcessingFile}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitDisabled} 
            className="ember-glow"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving Profile...
              </>
            ) : isProcessingFile ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processing Image...
              </>
            ) : (
              'Save Profile'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
