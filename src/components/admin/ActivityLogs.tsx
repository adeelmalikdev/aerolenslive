import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  Activity, 
  UserPlus, 
  Mail, 
  Plane, 
  RefreshCw,
  Filter,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ActivityLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  user_name: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: any;
  created_at: string;
}

const actionIcons: Record<string, any> = {
  signup: UserPlus,
  newsletter_subscribe: Mail,
  newsletter_unsubscribe: Mail,
  booking_created: Plane,
  booking_status_changed: Plane,
};

const actionColors: Record<string, string> = {
  signup: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  newsletter_subscribe: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  newsletter_unsubscribe: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  booking_created: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  booking_status_changed: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
};

const actionLabels: Record<string, string> = {
  signup: 'User Signed Up',
  newsletter_subscribe: 'Newsletter Subscribed',
  newsletter_unsubscribe: 'Newsletter Unsubscribed',
  booking_created: 'Booking Created',
  booking_status_changed: 'Booking Status Changed',
};

export function ActivityLogs() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filter !== 'all') {
        query = query.eq('action', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (err: any) {
      console.error('Error fetching activity logs:', err);
      toast({
        title: 'Error',
        description: 'Failed to fetch activity logs',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearOldLogs = async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { error } = await supabase
        .from('activity_logs')
        .delete()
        .lt('created_at', thirtyDaysAgo.toISOString());

      if (error) throw error;

      toast({ title: 'Old logs cleared', description: 'Logs older than 30 days have been removed' });
      fetchLogs();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const getActionDescription = (log: ActivityLog) => {
    const name = log.user_name || log.user_email || 'Someone';
    
    switch (log.action) {
      case 'signup':
        return `${name} created an account`;
      case 'newsletter_subscribe':
        return `${log.user_email} subscribed to the newsletter`;
      case 'newsletter_unsubscribe':
        return `${log.user_email} unsubscribed from the newsletter`;
      case 'booking_created':
        return `Booking ${log.details?.reference || log.entity_id} was created`;
      case 'booking_status_changed':
        return `Booking ${log.details?.reference} changed from ${log.details?.old_status} to ${log.details?.new_status}`;
      default:
        return log.action;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Activity Logs
            </CardTitle>
            <CardDescription>
              Recent activity across the platform ({logs.length} entries)
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activities</SelectItem>
                <SelectItem value="signup">User Signups</SelectItem>
                <SelectItem value="newsletter_subscribe">Newsletter Subscribes</SelectItem>
                <SelectItem value="newsletter_unsubscribe">Newsletter Unsubscribes</SelectItem>
                <SelectItem value="booking_created">Bookings Created</SelectItem>
                <SelectItem value="booking_status_changed">Booking Status Changes</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchLogs} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="outline" size="icon" onClick={clearOldLogs} title="Clear logs older than 30 days">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          {logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {isLoading ? 'Loading activity logs...' : 'No activity logs found.'}
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => {
                const Icon = actionIcons[log.action] || Activity;
                const colorClass = actionColors[log.action] || 'bg-gray-100 text-gray-800';
                
                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className={`p-2 rounded-full ${colorClass}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {getActionDescription(log)}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {actionLabels[log.action] || log.action}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(log.created_at), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
