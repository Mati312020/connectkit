import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookingStatusBadge } from "@/components/booking/BookingStatusBadge";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { Booking } from "@/types";

interface RecentBookingsProps {
  bookings: Booking[];
  title?: string;
}

export function RecentBookings({ bookings, title = "Reservas recientes" }: RecentBookingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay reservas aún
          </p>
        ) : (
          <div className="space-y-3">
            {bookings.slice(0, 5).map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div>
                  <p className="text-sm font-medium">
                    {formatDateTime(booking.startDateTime)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {booking.totalHours}h — {formatCurrency(booking.totalAmount)}
                  </p>
                </div>
                <BookingStatusBadge status={booking.status} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
