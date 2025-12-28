import { useState } from 'react';
import { format } from 'date-fns';
import { X, Star, MapPin, Calendar, Check, CreditCard, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HotelOffer } from '@/types/hotel';
import { useHotelBookings } from '@/hooks/useHotelBookings';
import { useAuth } from '@/hooks/useAuth';

interface HotelDetailsModalProps {
  hotel: HotelOffer | null;
  open: boolean;
  onClose: () => void;
}

export function HotelDetailsModal({ hotel, open, onClose }: HotelDetailsModalProps) {
  const [guestLastName, setGuestLastName] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const { createBooking, loading } = useHotelBookings();
  const { user } = useAuth();

  if (!hotel) return null;

  const offer = hotel.offers?.[0];
  if (!offer) return null;

  const rating = hotel.hotel.rating ? parseInt(hotel.hotel.rating) : 0;
  const price = parseFloat(offer.price.total);
  const currency = offer.price.currency;
  
  const checkIn = new Date(offer.checkInDate);
  const checkOut = new Date(offer.checkOutDate);
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

  const handleBook = async () => {
    if (!guestLastName.trim()) return;
    
    setIsBooking(true);
    
    const hotelData = {
      hotelName: hotel.hotel.name,
      hotelAddress: hotel.hotel.address?.lines?.join(', ') + (hotel.hotel.address?.cityName ? `, ${hotel.hotel.address.cityName}` : ''),
      roomType: offer.room.typeEstimated?.category?.replace(/_/g, ' ') || 'Standard Room',
      price: price.toFixed(2),
      currency,
      hotelId: hotel.hotel.hotelId,
      rating: hotel.hotel.rating,
    };

    const result = await createBooking(
      hotelData,
      guestLastName,
      offer.checkInDate,
      offer.checkOutDate,
      user?.email || undefined,
      user?.user_metadata?.full_name || undefined
    );

    setIsBooking(false);
    
    if (result) {
      setGuestLastName('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{hotel.hotel.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Hotel image */}
          <div className="w-full h-48 bg-muted rounded-lg overflow-hidden">
            {hotel.hotel.media?.[0]?.uri ? (
              <img 
                src={hotel.hotel.media[0].uri} 
                alt={hotel.hotel.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                No image available
              </div>
            )}
          </div>

          {/* Rating and location */}
          <div className="flex items-center gap-4">
            {rating > 0 && (
              <div className="flex items-center gap-1">
                {Array.from({ length: rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
            )}
            {hotel.hotel.address && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>
                  {hotel.hotel.address.lines?.join(', ')}
                  {hotel.hotel.address.cityName && `, ${hotel.hotel.address.cityName}`}
                </span>
              </div>
            )}
          </div>

          <Separator />

          {/* Stay details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Calendar className="h-4 w-4" />
                Check-in
              </div>
              <div className="font-semibold text-foreground">
                {format(checkIn, 'EEE, MMM d, yyyy')}
              </div>
              {offer.policies?.checkInOut?.checkIn && (
                <div className="text-sm text-muted-foreground">
                  From {offer.policies.checkInOut.checkIn}
                </div>
              )}
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Calendar className="h-4 w-4" />
                Check-out
              </div>
              <div className="font-semibold text-foreground">
                {format(checkOut, 'EEE, MMM d, yyyy')}
              </div>
              {offer.policies?.checkInOut?.checkOut && (
                <div className="text-sm text-muted-foreground">
                  Until {offer.policies.checkInOut.checkOut}
                </div>
              )}
            </div>
          </div>

          {/* Room details */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-semibold text-foreground mb-2">Room Details</h4>
            {offer.room.typeEstimated && (
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {offer.room.typeEstimated.category?.replace(/_/g, ' ')}
                  </Badge>
                </div>
                {offer.room.typeEstimated.beds && (
                  <div className="text-muted-foreground">
                    {offer.room.typeEstimated.beds} {offer.room.typeEstimated.bedType?.toLowerCase() || 'bed'}(s)
                  </div>
                )}
              </div>
            )}
            {offer.room.description?.text && (
              <p className="text-sm text-muted-foreground mt-2">
                {offer.room.description.text}
              </p>
            )}
          </div>

          {/* Amenities */}
          {hotel.hotel.amenities && hotel.hotel.amenities.length > 0 && (
            <div>
              <h4 className="font-semibold text-foreground mb-2">Amenities</h4>
              <div className="flex flex-wrap gap-2">
                {hotel.hotel.amenities.slice(0, 12).map((amenity) => (
                  <Badge key={amenity} variant="outline" className="flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    {amenity.replace(/_/g, ' ').toLowerCase()}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Cancellation policy */}
          {offer.policies?.cancellations?.[0] && (
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-semibold text-foreground mb-2">Cancellation Policy</h4>
              <p className="text-sm text-muted-foreground">
                {offer.policies.cancellations[0].description?.text || 
                  `Free cancellation until ${offer.policies.cancellations[0].deadline}`}
              </p>
            </div>
          )}

          <Separator />

          {/* Guest details input */}
          <div className="space-y-2">
            <Label htmlFor="guest-last-name">Guest Last Name</Label>
            <Input
              id="guest-last-name"
              placeholder="Enter guest last name"
              value={guestLastName}
              onChange={(e) => setGuestLastName(e.target.value)}
            />
          </div>

          {/* Price and booking */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-foreground">
                {currency} {price.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">
                Total for {nights} night{nights > 1 ? 's' : ''}
              </div>
            </div>
            <Button 
              size="lg" 
              onClick={handleBook} 
              disabled={!guestLastName.trim() || isBooking || loading || !user}
            >
              {isBooking || loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Booking...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Book Now
                </>
              )}
            </Button>
          </div>
          
          {!user && (
            <p className="text-sm text-muted-foreground text-center">
              Please sign in to book this hotel
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
