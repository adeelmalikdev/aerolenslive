import { useState, useEffect, useCallback } from 'react';
import { format, differenceInYears } from 'date-fns';
import { User, Calendar, Trash2, Phone, Eye, Search, Shield, ShieldOff, Mail, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UserDetailsModal } from './UserDetailsModal';

interface EnrichedUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  full_name: string | null;
  avatar_url: string | null;
  phone_number: string | null;
  country_code: string | null;
  date_of_birth: string | null;
  roles: string[];
  is_admin: boolean;
}

interface UsersTableProps {
  onUserDeleted?: () => void;
}

export function UsersTable({ onUserDeleted }: UsersTableProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<EnrichedUser | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [users, setUsers] = useState<EnrichedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingRole, setTogglingRole] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-list-users');
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      setUsers(data.users || []);
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to fetch users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDeleteUser = async (userId: string, userName: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ 
        title: 'User deleted', 
        description: `${userName || 'User'} has been removed.` 
      });
      
      fetchUsers();
      onUserDeleted?.();
    } catch (err: any) {
      toast({ 
        title: 'Error', 
        description: err.message, 
        variant: 'destructive' 
      });
    }
  };

  const handleToggleAdmin = async (userId: string, isCurrentlyAdmin: boolean) => {
    setTogglingRole(userId);
    try {
      const { data, error } = await supabase.functions.invoke('admin-toggle-role', {
        body: { 
          userId, 
          role: 'admin', 
          action: isCurrentlyAdmin ? 'remove' : 'add' 
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ 
        title: isCurrentlyAdmin ? 'Admin removed' : 'Admin added', 
        description: isCurrentlyAdmin 
          ? 'User is no longer an admin.' 
          : 'User is now an admin.' 
      });
      
      fetchUsers();
    } catch (err: any) {
      toast({ 
        title: 'Error', 
        description: err.message, 
        variant: 'destructive' 
      });
    } finally {
      setTogglingRole(null);
    }
  };

  const handleViewDetails = (user: EnrichedUser) => {
    setSelectedUser(user);
    setDetailsModalOpen(true);
  };

  const formatPhone = (user: EnrichedUser) => {
    if (!user.phone_number) return null;
    const code = user.country_code || '';
    return `${code} ${user.phone_number}`;
  };

  const calculateAge = (dob: string) => {
    return differenceInYears(new Date(), new Date(dob));
  };

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.id.toLowerCase().includes(query) ||
      user.phone_number?.includes(query)
    );
  });

  const admins = filteredUsers.filter(u => u.is_admin);
  const regularUsers = filteredUsers.filter(u => !u.is_admin);

  const renderUserRow = (user: EnrichedUser) => (
    <TableRow key={user.id}>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar_url || undefined} />
            <AvatarFallback>
              {user.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">
              {user.full_name || <span className="text-muted-foreground">No name</span>}
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              {user.id?.slice(0, 8)}...
            </span>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5">
          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm">{user.email}</span>
        </div>
      </TableCell>
      <TableCell>
        {user.date_of_birth ? (
          <div className="flex items-center gap-2">
            <span className="text-sm">
              {format(new Date(user.date_of_birth), 'MMM d, yyyy')}
            </span>
            <Badge variant="secondary" className="text-xs">
              {calculateAge(user.date_of_birth)}y
            </Badge>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">Not set</span>
        )}
      </TableCell>
      <TableCell>
        {formatPhone(user) ? (
          <div className="flex items-center gap-1 text-sm">
            <Phone className="h-3 w-3 text-muted-foreground" />
            {formatPhone(user)}
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">Not set</span>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {format(new Date(user.created_at), 'MMM d, yyyy')}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleViewDetails(user)}
            title="View details"
          >
            <Eye className="h-4 w-4" />
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={togglingRole === user.id}
                title={user.is_admin ? 'Remove admin' : 'Make admin'}
              >
                {togglingRole === user.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : user.is_admin ? (
                  <ShieldOff className="h-4 w-4 text-amber-500" />
                ) : (
                  <Shield className="h-4 w-4 text-primary" />
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {user.is_admin ? 'Remove Admin Role' : 'Grant Admin Role'}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {user.is_admin 
                    ? `Are you sure you want to remove admin privileges from ${user.full_name || user.email}?`
                    : `Are you sure you want to make ${user.full_name || user.email} an admin? They will have full access to the admin panel.`
                  }
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                >
                  {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete User</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete {user.full_name || user.email}? 
                  This action cannot be undone and will remove all their data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDeleteUser(user.id, user.full_name || user.email || '')}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  );

  const renderTable = (usersList: EnrichedUser[], emptyMessage: string) => (
    usersList.length === 0 ? (
      <div className="text-center py-8 text-muted-foreground">
        {emptyMessage}
      </div>
    ) : (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Date of Birth</TableHead>
              <TableHead>Phone Number</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usersList.map(renderUserRow)}
          </TableBody>
        </Table>
      </div>
    )
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Management
          </CardTitle>
          <CardDescription>
            Manage all users on the platform ({users.length} total: {admins.length} admins, {regularUsers.length} users)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, ID, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All ({filteredUsers.length})</TabsTrigger>
              <TabsTrigger value="admins" className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" />
                Admins ({admins.length})
              </TabsTrigger>
              <TabsTrigger value="users">Users ({regularUsers.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-4">
              {renderTable(filteredUsers, searchQuery ? 'No users match your search.' : 'No users registered yet.')}
            </TabsContent>
            <TabsContent value="admins" className="mt-4">
              {renderTable(admins, searchQuery ? 'No admins match your search.' : 'No admins yet.')}
            </TabsContent>
            <TabsContent value="users" className="mt-4">
              {renderTable(regularUsers, searchQuery ? 'No users match your search.' : 'No regular users yet.')}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {selectedUser && (
        <UserDetailsModal
          user={{
            id: selectedUser.id,
            user_id: selectedUser.id,
            full_name: selectedUser.full_name,
            avatar_url: selectedUser.avatar_url,
            date_of_birth: selectedUser.date_of_birth,
            phone_number: selectedUser.phone_number,
            country_code: selectedUser.country_code,
            created_at: selectedUser.created_at,
            updated_at: selectedUser.created_at,
          }}
          open={detailsModalOpen}
          onOpenChange={setDetailsModalOpen}
        />
      )}
    </>
  );
}