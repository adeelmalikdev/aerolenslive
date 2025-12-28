import { useState } from 'react';
import { Bell, BellOff, Trash2, TrendingDown, Plane } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { usePriceAlerts, PriceAlert } from '@/hooks/usePriceAlerts';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface PriceAlertButtonProps {
  originCode: string;
  originName: string;
  destinationCode: string;
  destinationName: string;
  currentPrice?: number;
}

export function PriceAlertButton({
  originCode,
  originName,
  destinationCode,
  destinationName,
  currentPrice,
}: PriceAlertButtonProps) {
  const [open, setOpen] = useState(false);
  const [targetPrice, setTargetPrice] = useState(
    currentPrice ? Math.floor(currentPrice * 0.9).toString() : ''
  );
  const { createAlert, alerts, loading } = usePriceAlerts();
  const { user } = useAuth();
  const navigate = useNavigate();

  const existingAlert = alerts.find(
    a => a.origin_code === originCode && 
         a.destination_code === destinationCode && 
         a.is_active
  );

  const handleCreate = async () => {
    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) return;

    const success = await createAlert(
      originCode,
      originName,
      destinationCode,
      destinationName,
      price,
      currentPrice,
      user?.email,
      user?.user_metadata?.full_name
    );

    if (success) setOpen(false);
  };

  if (!user) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate('/auth')}
        className="gap-2"
      >
        <Bell className="h-4 w-4" />
        Set Alert
      </Button>
    );
  }

  if (existingAlert) {
    return (
      <Button
        variant="secondary"
        size="sm"
        disabled
        className="gap-2"
      >
        <Bell className="h-4 w-4 text-primary" />
        Alert Set (${existingAlert.target_price})
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Bell className="h-4 w-4" />
          Set Price Alert
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-primary" />
            Create Price Alert
          </DialogTitle>
          <DialogDescription>
            Get notified when flight prices drop for this route
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-center gap-4 p-4 bg-muted/30 rounded-lg">
            <div className="text-center">
              <p className="font-semibold">{originCode}</p>
              <p className="text-sm text-muted-foreground">{originName}</p>
            </div>
            <Plane className="h-5 w-5 text-muted-foreground" />
            <div className="text-center">
              <p className="font-semibold">{destinationCode}</p>
              <p className="text-sm text-muted-foreground">{destinationName}</p>
            </div>
          </div>

          {currentPrice && (
            <div className="text-center text-sm text-muted-foreground">
              Current lowest price: <span className="font-semibold text-foreground">${currentPrice}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="target-price">Alert me when price drops below</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="target-price"
                type="number"
                placeholder="Enter target price"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                className="pl-8"
                min="1"
              />
            </div>
          </div>

          <Button 
            onClick={handleCreate} 
            disabled={loading || !targetPrice}
            className="w-full"
          >
            {loading ? 'Creating...' : 'Create Alert'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function PriceAlertsList() {
  const { alerts, loading, updateAlert, deleteAlert } = usePriceAlerts();
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  if (loading && alerts.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading alerts...
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="p-8 text-center">
        <Bell className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-muted-foreground">No price alerts set</p>
        <p className="text-sm text-muted-foreground mt-1">
          Search for flights and set alerts to track price drops
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <PriceAlertCard
          key={alert.id}
          alert={alert}
          onToggle={() => updateAlert(alert.id, { is_active: !alert.is_active })}
          onDelete={() => deleteAlert(alert.id)}
        />
      ))}
    </div>
  );
}

interface PriceAlertCardProps {
  alert: PriceAlert;
  onToggle: () => void;
  onDelete: () => void;
}

function PriceAlertCard({ alert, onToggle, onDelete }: PriceAlertCardProps) {
  const priceDropped = alert.current_price && alert.current_price <= alert.target_price;

  return (
    <div className={`border rounded-lg p-4 ${!alert.is_active ? 'opacity-60' : ''} ${priceDropped ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold">{alert.origin_code}</span>
            <Plane className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">{alert.destination_code}</span>
            {priceDropped && (
              <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">
                Price dropped!
              </span>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {alert.origin_name} → {alert.destination_name}
          </div>
          <div className="flex items-center gap-4 mt-2 text-sm">
            <span>
              Target: <span className="font-semibold text-foreground">${alert.target_price}</span>
            </span>
            {alert.current_price && (
              <span>
                Current: <span className={`font-semibold ${priceDropped ? 'text-green-600 dark:text-green-400' : 'text-foreground'}`}>
                  ${alert.current_price}
                </span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            title={alert.is_active ? 'Pause alert' : 'Resume alert'}
          >
            {alert.is_active ? (
              <Bell className="h-4 w-4 text-primary" />
            ) : (
              <BellOff className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
