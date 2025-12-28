import React, { useState } from 'react';
import { Check, Download, Plane, Copy, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BookingSuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingReference: string;
  flightNumber: string;
  airline: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  cabinClass: string;
  passengerName: string;
  autoDownload?: boolean;
}

export function BookingSuccessModal({
  open,
  onOpenChange,
  bookingReference,
  flightNumber,
  airline,
  origin,
  destination,
  departureTime,
  arrivalTime,
  cabinClass,
  passengerName,
  autoDownload = false,
}: BookingSuccessModalProps) {
  const [downloading, setDownloading] = useState(false);
  const [hasAutoDownloaded, setHasAutoDownloaded] = useState(false);
  const { toast } = useToast();

  // Auto-download boarding pass when modal opens
  React.useEffect(() => {
    if (open && autoDownload && !hasAutoDownloaded && bookingReference) {
      setHasAutoDownloaded(true);
      // Small delay to let modal render first
      const timer = setTimeout(() => {
        downloadBoardingPass();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [open, autoDownload, hasAutoDownloaded, bookingReference]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard`,
    });
  };

  const downloadBoardingPass = async () => {
    setDownloading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-boarding-pass', {
        body: {
          bookingReference,
          passengerName,
          flightNumber,
          airline,
          origin,
          destination,
          departureTime,
          arrivalTime,
          cabinClass,
        },
      });

      if (error) throw error;

      // Convert base64 to blob and download
      const byteCharacters = atob(data.pdf);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });

      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      toast({
        title: 'Downloaded!',
        description: 'Your boarding pass has been downloaded.',
      });
    } catch (error) {
      console.error('Failed to download boarding pass:', error);
      toast({
        title: 'Download Failed',
        description: 'Unable to generate boarding pass. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Check className="h-8 w-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">Booking Confirmed!</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Flight Number - Large and Prominent */}
          <div className="bg-primary/5 rounded-xl p-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">Flight Number</p>
            <div className="flex items-center justify-center gap-2">
              <Badge variant="default" className="text-2xl font-bold px-4 py-2">
                <Plane className="h-5 w-5 mr-2" />
                {flightNumber}
              </Badge>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => copyToClipboard(flightNumber, 'Flight number')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">{airline}</p>
          </div>

          {/* Booking Reference */}
          <div className="bg-muted/30 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Booking Reference</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl font-mono font-bold tracking-wider">{bookingReference}</span>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => copyToClipboard(bookingReference, 'Booking reference')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Route */}
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold">{origin}</p>
              <p className="text-sm text-muted-foreground">{formatTime(departureTime)}</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-px bg-border" />
              <Plane className="h-4 w-4 text-muted-foreground my-1 rotate-90" />
              <div className="w-16 h-px bg-border" />
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{destination}</p>
              <p className="text-sm text-muted-foreground">{formatTime(arrivalTime)}</p>
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            {formatDate(departureTime)} • {cabinClass}
          </div>

          <Separator />

          {/* Download Button */}
          <Button 
            onClick={downloadBoardingPass} 
            className="w-full" 
            size="lg"
            disabled={downloading}
          >
            {downloading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-5 w-5 mr-2" />
                Download Boarding Pass
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            A confirmation email with your boarding pass has been sent to your email.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
