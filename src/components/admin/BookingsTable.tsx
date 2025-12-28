import { format } from 'date-fns';
import { Plane, Calendar } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface BookingsTableProps {
  bookings: any[];
  onUpdateStatus: (id: string, status: string) => Promise<void>;
}

const statusColors: Record<string, string> = {
  confirmed: 'default',
  pending: 'secondary',
  cancelled: 'destructive',
  completed: 'outline',
};

export function BookingsTable({ bookings, onUpdateStatus }: BookingsTableProps) {
  const { toast } = useToast();

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await onUpdateStatus(id, newStatus);
      toast({ title: 'Booking status updated' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const getFlightInfo = (flightData: any) => {
    try {
      const data = typeof flightData === 'string' ? JSON.parse(flightData) : flightData;
      return {
        origin: data.itineraries?.[0]?.segments?.[0]?.departure?.iataCode || 'N/A',
        destination: data.itineraries?.[0]?.segments?.slice(-1)?.[0]?.arrival?.iataCode || 'N/A',
        price: data.price?.total || 'N/A',
        currency: data.price?.currency || 'USD',
      };
    } catch {
      return { origin: 'N/A', destination: 'N/A', price: 'N/A', currency: 'USD' };
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plane className="h-5 w-5" />
          Bookings
        </CardTitle>
        <CardDescription>
          All flight bookings ({bookings.length} total)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No bookings yet.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Passenger</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => {
                const flightInfo = getFlightInfo(booking.flight_data);
                return (
                  <TableRow key={booking.id}>
                    <TableCell className="font-mono font-medium">
                      {booking.booking_reference}
                    </TableCell>
                    <TableCell>{booking.passenger_last_name}</TableCell>
                    <TableCell>
                      <span className="font-medium">{flightInfo.origin}</span>
                      <span className="mx-1 text-muted-foreground">→</span>
                      <span className="font-medium">{flightInfo.destination}</span>
                    </TableCell>
                    <TableCell>
                      {flightInfo.currency} {flightInfo.price}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(booking.created_at), 'MMM d, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        defaultValue={booking.status || 'confirmed'}
                        onValueChange={(value) => handleStatusChange(booking.id, value)}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
