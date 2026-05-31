export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUNDED";

export interface Booking {
  id: string;
  clientId: string;
  providerId: string;
  startDateTime: Date;
  endDateTime: Date;
  totalHours: number;
  baseAmount: number;   // en centavos ARS
  clientFee: number;    // comisión del cliente
  providerFee: number;  // comisión del proveedor
  totalAmount: number;  // lo que paga el cliente
  status: BookingStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBookingInput {
  providerId: string;
  startDateTime: string;
  endDateTime: string;
  notes?: string;
}

export interface Availability {
  id: string;
  providerId: string;
  dayOfWeek: number; // 0=Domingo ... 6=Sábado
  startTime: string; // "09:00"
  endTime: string;   // "18:00"
  isAvailable: boolean;
}
