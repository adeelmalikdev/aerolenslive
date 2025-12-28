import { format, differenceInYears } from 'date-fns';
import { User, Calendar, Phone, Mail, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  phone_number: string | null;
  country_code: string | null;
  created_at: string;
  updated_at: string;
}

interface UserDetailsModalProps {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserDetailsModal({ user, open, onOpenChange }: UserDetailsModalProps) {
  if (!user) return null;

  const getInitials = () => {
    if (!user.full_name) return 'U';
    return user.full_name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const calculateAge = (dob: string) => {
    return differenceInYears(new Date(), new Date(dob));
  };

  const formatPhone = () => {
    if (!user.phone_number) return null;
    const code = user.country_code || '';
    return `${code} ${user.phone_number}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Details
          </DialogTitle>
          <DialogDescription>
            Complete profile information for this user
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Header */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">
                {user.full_name || 'Name not set'}
              </h3>
              <p className="text-sm text-muted-foreground font-mono">
                ID: {user.user_id.slice(0, 8)}...
              </p>
            </div>
          </div>

          <Separator />

          {/* Profile Details */}
          <div className="space-y-4">
            {/* Date of Birth */}
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Date of Birth</p>
                {user.date_of_birth ? (
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(user.date_of_birth), 'MMMM d, yyyy')}
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      {calculateAge(user.date_of_birth)} years old
                    </Badge>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Not provided</p>
                )}
              </div>
            </div>

            {/* Phone Number */}
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Phone Number</p>
                <p className="text-sm text-muted-foreground">
                  {formatPhone() || 'Not provided'}
                </p>
              </div>
            </div>

            <Separator />

            {/* Account Info */}
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium">Account Created</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(user.created_at), 'MMMM d, yyyy \'at\' h:mm a')}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Last Profile Update</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(user.updated_at), 'MMMM d, yyyy \'at\' h:mm a')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
