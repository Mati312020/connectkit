import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { BookingStatusBadge } from "./BookingStatusBadge";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import type { Booking } from "@/types";

interface BookingCardProps {
  booking: Booking;
  actions?: React.ReactNode;
}

export function BookingCard({ booking, actions }: BookingCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div>
          <p className="font-medium">{formatDate(booking.startDateTime)}</p>
          <p className="text-sm text-muted-foreground">
            {formatDateTime(booking.startDateTime)} — {booking.totalHours}h
          </p>
        </div>
        <BookingStatusBadge status={booking.status} />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground">Subtotal</p>
            <p className="font-medium">{formatCurrency(booking.baseAmount)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Total</p>
            <p className="font-medium">{formatCurrency(booking.totalAmount)}</p>
          </div>
        </div>
        {booking.notes && (
          <p className="text-sm text-muted-foreground mt-2 italic">{booking.notes}</p>
        )}
      </CardContent>
      {actions && <CardFooter>{actions}</CardFooter>}
    </Card>
  );
}
