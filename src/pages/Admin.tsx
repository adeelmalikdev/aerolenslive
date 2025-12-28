import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, RefreshCw, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin, useAdminData } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminStats } from '@/components/admin/AdminStats';
import { UsersTable } from '@/components/admin/UsersTable';
import { SubscribersTable } from '@/components/admin/SubscribersTable';
import { BookingsTable } from '@/components/admin/BookingsTable';
import { AnalyticsCharts } from '@/components/admin/AnalyticsCharts';
import { ActivityLogs } from '@/components/admin/ActivityLogs';

export default function Admin() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const {
    users,
    subscribers,
    bookings,
    isLoading: dataLoading,
    error,
    refetch,
    deleteSubscriber,
    toggleSubscriberStatus,
    updateBookingStatus,
  } = useAdminData();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!adminLoading && !isAdmin && user) {
      navigate('/');
    }
  }, [isAdmin, adminLoading, user, navigate]);

  if (authLoading || adminLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <AlertTriangle className="h-16 w-16 mx-auto text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground">You don't have permission to access this page.</p>
      </div>
    );
  }

  const activeSubscribers = subscribers.filter(s => s.is_active).length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage users, subscribers, and bookings</p>
          </div>
        </div>
        <Button variant="outline" onClick={refetch} disabled={dataLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${dataLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-6">
          Error loading data: {error}
        </div>
      )}

      <div className="space-y-8">
        <AdminStats
          usersCount={users.length}
          subscribersCount={subscribers.length}
          bookingsCount={bookings.length}
          activeSubscribers={activeSubscribers}
        />

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
            <TabsTrigger value="subscribers">Newsletter ({subscribers.length})</TabsTrigger>
            <TabsTrigger value="bookings">Bookings ({bookings.length})</TabsTrigger>
            <TabsTrigger value="activity">Activity Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <AnalyticsCharts
              users={users}
              subscribers={subscribers}
              bookings={bookings}
            />
          </TabsContent>

          <TabsContent value="users">
            <UsersTable onUserDeleted={refetch} />
          </TabsContent>

          <TabsContent value="subscribers">
            <SubscribersTable
              subscribers={subscribers}
              onDelete={deleteSubscriber}
              onToggleStatus={toggleSubscriberStatus}
            />
          </TabsContent>

          <TabsContent value="bookings">
            <BookingsTable
              bookings={bookings}
              onUpdateStatus={updateBookingStatus}
            />
          </TabsContent>

          <TabsContent value="activity">
            <ActivityLogs />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
