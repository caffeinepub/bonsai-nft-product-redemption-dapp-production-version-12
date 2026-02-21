import { useState } from 'react';
import { useGetAddressBook, useAddAddressBookEntry, useUpdateAddressBookEntry, useDeleteAddressBookEntry } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookUser, Plus, Edit2, Trash2, Check, X, Copy } from 'lucide-react';
import { Principal } from '@icp-sdk/core/principal';
import { toast } from 'sonner';
import type { AddressBookEntry } from '../backend';

interface AddressBookModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectPrincipal?: (principal: string, nickname: string) => void;
}

export default function AddressBookModal({ open, onOpenChange, onSelectPrincipal }: AddressBookModalProps) {
  const { data: addressBook, isLoading } = useGetAddressBook();
  const { mutate: addEntry, isPending: isAdding } = useAddAddressBookEntry();
  const { mutate: updateEntry, isPending: isUpdating } = useUpdateAddressBookEntry();
  const { mutate: deleteEntry, isPending: isDeleting } = useDeleteAddressBookEntry();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<AddressBookEntry | null>(null);
  const [newPrincipal, setNewPrincipal] = useState('');
  const [newNickname, setNewNickname] = useState('');
  const [editNickname, setEditNickname] = useState('');

  const handleAdd = () => {
    try {
      const principal = Principal.fromText(newPrincipal.trim());
      addEntry({ principal, nickname: newNickname.trim() }, {
        onSuccess: () => {
          setNewPrincipal('');
          setNewNickname('');
          setShowAddForm(false);
        },
      });
    } catch (error) {
      toast.error('Invalid Principal ID format');
    }
  };

  const handleUpdate = (entry: AddressBookEntry) => {
    updateEntry({ principal: entry.principal, newNickname: editNickname.trim() }, {
      onSuccess: () => {
        setEditingEntry(null);
        setEditNickname('');
      },
    });
  };

  const handleDelete = (principal: Principal) => {
    deleteEntry(principal);
  };

  const handleCopyPrincipal = async (principal: string) => {
    try {
      await navigator.clipboard.writeText(principal);
      toast.success('Principal ID copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy Principal ID');
    }
  };

  const handleSelect = (entry: AddressBookEntry) => {
    if (onSelectPrincipal) {
      onSelectPrincipal(entry.principal.toString(), entry.nickname);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl border-primary/20 max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookUser className="h-5 w-5 text-primary animate-ember-float" />
            Address Book
          </DialogTitle>
          <DialogDescription>
            Manage frequently used Principal IDs for easy transfers and airdrops
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Add New Entry Form */}
          {showAddForm ? (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPrincipal">Principal ID *</Label>
                  <Input
                    id="newPrincipal"
                    placeholder="Enter Principal ID"
                    value={newPrincipal}
                    onChange={(e) => setNewPrincipal(e.target.value)}
                    className="border-primary/20 font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newNickname">Nickname *</Label>
                  <Input
                    id="newNickname"
                    placeholder="Enter a friendly nickname"
                    value={newNickname}
                    onChange={(e) => setNewNickname(e.target.value)}
                    className="border-primary/20"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleAdd}
                    disabled={isAdding || !newPrincipal.trim() || !newNickname.trim()}
                    className="flex-1 ember-glow"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {isAdding ? 'Adding...' : 'Add Contact'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewPrincipal('');
                      setNewNickname('');
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Button
              onClick={() => setShowAddForm(true)}
              className="w-full gap-2 ember-glow"
            >
              <Plus className="h-4 w-4" />
              Add New Contact
            </Button>
          )}

          {/* Address Book List */}
          <ScrollArea className="h-[400px] pr-4">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading address book...</div>
            ) : addressBook && addressBook.length > 0 ? (
              <div className="space-y-3">
                {addressBook.map((entry) => (
                  <Card
                    key={entry.principal.toString()}
                    className="border-primary/20 card-fiery-hover animate-glow-entrance"
                  >
                    <CardContent className="py-4">
                      {editingEntry?.principal.toString() === entry.principal.toString() ? (
                        <div className="space-y-3">
                          <Input
                            value={editNickname}
                            onChange={(e) => setEditNickname(e.target.value)}
                            placeholder="Enter new nickname"
                            className="border-primary/20"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleUpdate(entry)}
                              disabled={isUpdating || !editNickname.trim()}
                              className="flex-1 ember-glow"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingEntry(null);
                                setEditNickname('');
                              }}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold">{entry.nickname}</h4>
                                <Badge variant="outline" className="text-xs">Contact</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground font-mono break-all">
                                {entry.principal.toString()}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Added: {new Date(Number(entry.createdAt) / 1000000).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {onSelectPrincipal && (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleSelect(entry)}
                                className="flex-1 ember-glow"
                              >
                                Select
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCopyPrincipal(entry.principal.toString())}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingEntry(entry);
                                setEditNickname(entry.nickname);
                              }}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(entry.principal)}
                              disabled={isDeleting}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BookUser className="h-16 w-16 text-muted-foreground mx-auto mb-4 animate-ember-float" />
                <h3 className="text-lg font-semibold mb-2">No Contacts Yet</h3>
                <p className="text-sm text-muted-foreground">
                  Add frequently used Principal IDs for quick access
                </p>
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
