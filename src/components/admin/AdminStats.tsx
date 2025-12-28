import { Users, Mail, Plane, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AdminStatsProps {
  usersCount: number;
  subscribersCount: number;
  bookingsCount: number;
  activeSubscribers: number;
}

export function AdminStats({ usersCount, subscribersCount, bookingsCount, activeSubscribers }: AdminStatsProps) {
  const stats = [
    {
      title: 'Total Users',
      value: usersCount,
      icon: Users,
      description: 'Registered accounts',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Newsletter Subscribers',
      value: subscribersCount,
      icon: Mail,
      description: `${activeSubscribers} active`,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Total Bookings',
      value: bookingsCount,
      icon: Plane,
      description: 'Flight bookings',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Conversion Rate',
      value: usersCount > 0 ? Math.round((bookingsCount / usersCount) * 100) : 0,
      icon: TrendingUp,
      description: 'Bookings per user %',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      suffix: '%',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <div className={`p-2 rounded-full ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stat.value}{stat.suffix || ''}
            </div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
