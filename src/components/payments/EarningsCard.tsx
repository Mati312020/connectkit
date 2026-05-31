import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { appConfig } from "@/config/app.config";
import { TrendingUp } from "lucide-react";

interface EarningsCardProps {
  grossAmount: number;    // bruto en centavos
  netAmount: number;      // neto (descontada comisión) en centavos
  bookingsCount: number;
  period?: string;
}

export function EarningsCard({ grossAmount, netAmount, bookingsCount, period = "Este mes" }: EarningsCardProps) {
  const commission = grossAmount - netAmount;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {period}
        </CardTitle>
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatCurrency(netAmount)}</div>
        <p className="text-xs text-muted-foreground mt-1">
          neto de {bookingsCount} reserva{bookingsCount !== 1 ? "s" : ""}
        </p>
        <div className="mt-3 pt-3 border-t text-xs text-muted-foreground space-y-1">
          <div className="flex justify-between">
            <span>Bruto facturado</span>
            <span>{formatCurrency(grossAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span>Comisión plataforma ({appConfig.commissions.provider}%)</span>
            <span>- {formatCurrency(commission)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
