import { useMemo } from 'react';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';
import { TrendingUp, Users, Mail, Plane } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from 'recharts';

interface AnalyticsChartsProps {
  users: any[];
  subscribers: any[];
  bookings: any[];
}

export function AnalyticsCharts({ users, subscribers, bookings }: AnalyticsChartsProps) {
  const last30Days = useMemo(() => {
    const end = startOfDay(new Date());
    const start = subDays(end, 29);
    return eachDayOfInterval({ start, end });
  }, []);

  const userGrowthData = useMemo(() => {
    return last30Days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const count = users.filter(u => 
        format(new Date(u.created_at), 'yyyy-MM-dd') === dayStr
      ).length;
      return {
        date: format(day, 'MMM d'),
        users: count,
      };
    });
  }, [users, last30Days]);

  const subscriberGrowthData = useMemo(() => {
    return last30Days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const count = subscribers.filter(s => 
        format(new Date(s.subscribed_at), 'yyyy-MM-dd') === dayStr
      ).length;
      return {
        date: format(day, 'MMM d'),
        subscribers: count,
      };
    });
  }, [subscribers, last30Days]);

  const bookingsData = useMemo(() => {
    return last30Days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const count = bookings.filter(b => 
        format(new Date(b.created_at), 'yyyy-MM-dd') === dayStr
      ).length;
      return {
        date: format(day, 'MMM d'),
        bookings: count,
      };
    });
  }, [bookings, last30Days]);

  const cumulativeData = useMemo(() => {
    let totalUsers = 0;
    let totalSubscribers = 0;
    let totalBookings = 0;

    return last30Days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      
      totalUsers += users.filter(u => 
        format(new Date(u.created_at), 'yyyy-MM-dd') === dayStr
      ).length;
      
      totalSubscribers += subscribers.filter(s => 
        format(new Date(s.subscribed_at), 'yyyy-MM-dd') === dayStr
      ).length;
      
      totalBookings += bookings.filter(b => 
        format(new Date(b.created_at), 'yyyy-MM-dd') === dayStr
      ).length;

      return {
        date: format(day, 'MMM d'),
        users: totalUsers,
        subscribers: totalSubscribers,
        bookings: totalBookings,
      };
    });
  }, [users, subscribers, bookings, last30Days]);

  const chartConfig = {
    users: { color: 'hsl(var(--primary))' },
    subscribers: { color: 'hsl(142, 76%, 36%)' },
    bookings: { color: 'hsl(262, 83%, 58%)' },
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Cumulative Growth */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Cumulative Growth (Last 30 Days)
          </CardTitle>
          <CardDescription>Total users, subscribers, and bookings over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cumulativeData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="users" 
                  stackId="1"
                  stroke={chartConfig.users.color}
                  fill={chartConfig.users.color}
                  fillOpacity={0.6}
                  name="Users"
                />
                <Area 
                  type="monotone" 
                  dataKey="subscribers" 
                  stackId="2"
                  stroke={chartConfig.subscribers.color}
                  fill={chartConfig.subscribers.color}
                  fillOpacity={0.6}
                  name="Subscribers"
                />
                <Area 
                  type="monotone" 
                  dataKey="bookings" 
                  stackId="3"
                  stroke={chartConfig.bookings.color}
                  fill={chartConfig.bookings.color}
                  fillOpacity={0.6}
                  name="Bookings"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Daily User Signups */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Daily User Signups
          </CardTitle>
          <CardDescription>New registrations per day</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar 
                  dataKey="users" 
                  fill={chartConfig.users.color}
                  radius={[4, 4, 0, 0]}
                  name="Users"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Daily Newsletter Subscriptions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-green-600" />
            Daily Newsletter Subscriptions
          </CardTitle>
          <CardDescription>New subscribers per day</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={subscriberGrowthData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Line 
                  type="monotone"
                  dataKey="subscribers" 
                  stroke={chartConfig.subscribers.color}
                  strokeWidth={2}
                  dot={{ fill: chartConfig.subscribers.color, strokeWidth: 2 }}
                  name="Subscribers"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Daily Bookings */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5 text-purple-600" />
            Daily Bookings
          </CardTitle>
          <CardDescription>Flight bookings per day</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bookingsData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar 
                  dataKey="bookings" 
                  fill={chartConfig.bookings.color}
                  radius={[4, 4, 0, 0]}
                  name="Bookings"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
