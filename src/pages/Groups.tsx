import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, ArrowRight, Copy, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PageTransition, listContainerVariants, listItemVariants } from '@/lib/animations';
import { SkeletonListLoader } from '@/components/ui/skeleton-loader';
import { useGroups, useCreateGroup, useJoinGroup, useGroupMembers } from '@/hooks/useGroups';
import { toast } from 'sonner';

// Generate a deterministic color from a string (for avatars)
function getAvatarColor(str: string): string {
  const colors = [
    'bg-violet-500', 'bg-blue-500', 'bg-green-500', 'bg-orange-500',
    'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-rose-500',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function GroupCard({ group }: { group: { id: string; name: string; description: string | null } }) {
  const navigate = useNavigate();
  const { data: members = [] } = useGroupMembers(group.id);

  const groupInitial = group.name.charAt(0).toUpperCase();
  const avatarColor = getAvatarColor(group.id);

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={listItemVariants}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <Card
        className="cursor-pointer hover:bg-muted/50 transition-all duration-200 hover:shadow-md border-border/50"
        onClick={() => navigate(`/groups/${group.id}`)}
      >
        <CardContent className="flex items-center gap-4 p-4">
          {/* Group Avatar */}
          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shrink-0 ${avatarColor}`}>
            {groupInitial}
          </div>

          {/* Group Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{group.name}</h3>
            {group.description ? (
              <p className="text-xs text-muted-foreground truncate mt-0.5">{group.description}</p>
            ) : (
              <p className="text-xs text-muted-foreground mt-0.5">
                {members.length} member{members.length !== 1 ? 's' : ''}
              </p>
            )}
            {group.description && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {members.length} member{members.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Member Avatars preview */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex -space-x-2">
              {members.slice(0, 3).map((m) => {
                const name = m.nickname || m.profile?.display_name || '';
                const initial = name ? name.charAt(0).toUpperCase() : '?';
                const color = getAvatarColor(m.user_id);
                return (
                  <div
                    key={m.id}
                    className={`h-6 w-6 rounded-full border-2 border-background flex items-center justify-center text-white text-[10px] font-bold ${color}`}
                  >
                    {initial}
                  </div>
                );
              })}
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground ml-1" />
          </div>
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
      setCreatedGroupCode(null);
      setNewGroupName('');
      setNewGroupDesc('');
      setInviteCode('');
    }
  };

  return (
    <PageTransition>
    <div className="page-content min-h-full bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Groups</h1>
            {groups.length > 0 && (
              <p className="text-xs text-muted-foreground">{groups.length} group{groups.length !== 1 ? 's' : ''}</p>
            )}
          </div>
          <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 rounded-full px-4">
                <Plus className="h-4 w-4" />
                New Group
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
                  
                  <div className="bg-primary/10 border-2 border-primary rounded-xl p-6">
                    <p className="text-sm text-muted-foreground mb-2">Invite Code</p>
                    <p className="font-mono text-4xl font-bold tracking-widest mb-4 text-primary">
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
                      placeholder="Enter 8-character code"
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

      <div className="p-4 space-y-3">
        {isLoading ? (
          <SkeletonListLoader count={3} />
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10">
              <Users className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">No Groups Yet</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              Create a group to start splitting expenses with friends, roommates, or travel buddies
            </p>
            <Button onClick={() => setDialogOpen(true)} className="gap-2 rounded-full px-6">
              <Plus className="h-4 w-4" />
              Create Your First Group
            </Button>
          </div>
        ) : (
          <motion.div className="space-y-3" variants={listContainerVariants} initial="initial" animate="animate">
            {groups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
    </PageTransition>
  );
}
