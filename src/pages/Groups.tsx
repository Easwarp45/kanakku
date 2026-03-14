import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, ArrowRight, UserPlus, Copy } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageTransition, listContainerVariants, listItemVariants } from '@/lib/animations';
import { SkeletonListLoader } from '@/components/ui/skeleton-loader';
import { useGroups, useCreateGroup, useJoinGroup, useGroupMembers } from '@/hooks/useGroups';
import { toast } from 'sonner';
import BottomNav from '@/components/layout/BottomNav';

function GroupCard({ group }: { group: { id: string; name: string; description: string | null } }) {
  const navigate = useNavigate();
  const { data: members = [] } = useGroupMembers(group.id);

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={listItemVariants}
      whileHover={{ scale: 1.02 }}
    >
    <Card 
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => navigate(`/groups/${group.id}`)}
    >
      <CardContent className="flex items-center gap-4 p-4">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Users className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{group.name}</h3>
          <p className="text-sm text-muted-foreground">
            {members.length} member{members.length !== 1 ? 's' : ''}
          </p>
        </div>
        <ArrowRight className="h-5 w-5 text-muted-foreground" />
      </CardContent>
    </Card>
    </motion.div>
  );
}

export default function Groups() {
  const navigate = useNavigate();
  const { data: groups = [], isLoading } = useGroups();
  const createGroup = useCreateGroup();
  const joinGroup = useJoinGroup();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [createdGroupCode, setCreatedGroupCode] = useState<string | null>(null);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    
    const result = await createGroup.mutateAsync({
      name: newGroupName.trim(),
      description: newGroupDesc.trim() || undefined,
    });

    if (result.invite_code) {
      setCreatedGroupCode(result.invite_code);
      setNewGroupName('');
      setNewGroupDesc('');
      // Keep dialog open to show the code
    }
  };

  const handleJoinGroup = async () => {
    if (!inviteCode.trim()) return;
    
    await joinGroup.mutateAsync(inviteCode.trim());
    setInviteCode('');
    setDialogOpen(false);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      // Reset when closing dialog
      setCreatedGroupCode(null);
      setNewGroupName('');
      setNewGroupDesc('');
      setInviteCode('');
    }
  };

  return (
    <PageTransition>
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Groups</h1>
          <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                New
              </Button>
            </DialogTrigger>
            <DialogContent>
              {createdGroupCode ? (
                // Show success screen with invite code
                <div className="space-y-4 text-center">
                  <DialogHeader>
                    <DialogTitle>Group Created! 🎉</DialogTitle>
                    <DialogDescription>
                      Share this invite code with friends
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="bg-primary/10 border-2 border-primary rounded-lg p-6">
                    <p className="text-sm text-muted-foreground mb-2">Invite Code</p>
                    <p className="font-mono text-4xl font-bold tracking-widest mb-4">
                      {createdGroupCode}
                    </p>
                    <Button 
                      variant="outline" 
                      className="w-full gap-2"
                      onClick={() => {
                        navigator.clipboard.writeText(createdGroupCode);
                        toast.success('Code copied!');
                      }}
                    >
                      <Copy className="h-4 w-4" />
                      Copy Code
                    </Button>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    onClick={() => setDialogOpen(false)}
                  >
                    Done
                  </Button>
                </div>
              ) : (
                // Show create/join form
                <>
              <DialogHeader>
                <DialogTitle>Create or Join Group</DialogTitle>
                <DialogDescription>
                  Start a new group or join an existing one with an invite code.
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="create" className="mt-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="create">Create New</TabsTrigger>
                  <TabsTrigger value="join">Join Group</TabsTrigger>
                </TabsList>

                <TabsContent value="create" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Group Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Roommates, Trip to Goa"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="desc">Description (optional)</Label>
                    <Input
                      id="desc"
                      placeholder="What's this group for?"
                      value={newGroupDesc}
                      onChange={(e) => setNewGroupDesc(e.target.value)}
                    />
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={handleCreateGroup}
                    disabled={!newGroupName.trim() || createGroup.isPending}
                  >
                    {createGroup.isPending ? 'Creating...' : 'Create Group'}
                  </Button>
                </TabsContent>

                <TabsContent value="join" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Invite Code</Label>
                    <Input
                      id="code"
                      placeholder="Enter 8-character code (e.g., ABC12345)"
                      value={inviteCode.toUpperCase()}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      maxLength={8}
                      className="font-mono text-lg text-center tracking-widest"
                    />
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={handleJoinGroup}
                    disabled={!inviteCode.trim() || joinGroup.isPending}
                  >
                    {joinGroup.isPending ? 'Joining...' : 'Join Group'}
                  </Button>
                </TabsContent>
              </Tabs>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {isLoading ? (
          <SkeletonListLoader count={3} />
        ) : groups.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <CardTitle className="mb-2">No Groups Yet</CardTitle>
              <CardDescription className="mb-4">
                Create a group to start splitting expenses with friends
              </CardDescription>
              <Button onClick={() => setDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Group
              </Button>
            </CardContent>
          </Card>
        ) : (
          <motion.div className="space-y-3" variants={listContainerVariants} initial="initial" animate="animate">
            {groups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </motion.div>
        )}
      </div>

      <BottomNav />
    </div>
    </PageTransition>
  );
}
