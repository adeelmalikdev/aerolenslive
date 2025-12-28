import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plane, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useFlightStatus, FlightStatus } from '@/hooks/useFlightStatus';

export function FlightStatusForm() {
  const [flightNumber, setFlightNumber] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const { flightStatus, isLoading, searched, searchFlight } = useFlightStatus();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flightNumber.trim() || !date) return;
    await searchFlight(flightNumber, date);
  };

  const getStatusColor = (status: FlightStatus['status']) => {
    switch (status) {
      case 'on_time':
      case 'arrived':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'delayed':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'boarding':
      case 'departed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: FlightStatus['status']) => {
    switch (status) {
      case 'on_time':
      case 'arrived':
        return <CheckCircle className="h-4 w-4" />;
      case 'delayed':
      case 'cancelled':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Plane className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="flight-number">Flight Number</Label>
            <Input
              id="flight-number"
              placeholder="e.g., AA100, BA1234"
              value={flightNumber}
              onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
              className="uppercase"
            />
            <p className="text-xs text-muted-foreground">
              Enter airline code + flight number (e.g., AA100, UA456)
            </p>
          </div>
          <div className="space-y-2">
            <Label>Flight Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <Button type="submit" disabled={isLoading || !flightNumber || !date}>
          {isLoading ? 'Checking...' : 'Check Flight Status'}
        </Button>
      </form>

      {searched && !flightStatus && (
        <div className="bg-muted/50 rounded-lg p-6 text-center">
          <p className="text-muted-foreground">
            No flight found with that number on the selected date. Please check and try again.
          </p>
        </div>
      )}

      {flightStatus && (
        <div className="bg-muted/30 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Plane className="h-5 w-5 text-primary" />
              <span className="font-semibold">{flightStatus.airline}</span>
              <span className="text-muted-foreground">{flightStatus.flightNumber}</span>
            </div>
            <span className={cn(
              'px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5',
              getStatusColor(flightStatus.status)
            )}>
              {getStatusIcon(flightStatus.status)}
              {flightStatus.status.replace('_', ' ').toUpperCase()}
              {flightStatus.delay && ` (${flightStatus.delay} min)`}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Departure</p>
              <p className="font-semibold text-lg">{flightStatus.origin}</p>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{format(new Date(flightStatus.scheduledDeparture), 'PPp')}</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Arrival</p>
              <p className="font-semibold text-lg">{flightStatus.destination}</p>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{format(new Date(flightStatus.scheduledArrival), 'PPp')}</span>
              </div>
            </div>
          </div>

          {(flightStatus.gate || flightStatus.terminal) && (
            <div className="flex gap-6 pt-4 border-t border-border">
              {flightStatus.terminal && (
                <div>
                  <p className="text-sm text-muted-foreground">Terminal</p>
                  <p className="font-semibold">{flightStatus.terminal}</p>
                </div>
              )}
              {flightStatus.gate && (
                <div>
                  <p className="text-sm text-muted-foreground">Gate</p>
                  <p className="font-semibold">{flightStatus.gate}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
