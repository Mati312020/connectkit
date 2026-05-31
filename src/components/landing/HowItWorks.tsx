import { appConfig } from "@/config/app.config";

const STEPS = [
  {
    number: "01",
    title: `Buscá tu ${appConfig.roles.provider.singular.toLowerCase()}`,
    description: `Filtrá por disponibilidad, calificación y zona.`,
  },
  {
    number: "02",
    title: "Reservá online",
    description: "Elegí fecha y horario directamente en el calendario.",
  },
  {
    number: "03",
    title: "Pagá seguro",
    description: "Con Mercado Pago. Tu dinero está protegido hasta que se confirme el servicio.",
  },
  {
    number: "04",
    title: "Recibí tu comprobante",
    description: "Factura fiscal emitida automáticamente.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">¿Cómo funciona?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {STEPS.map(({ number, title, description }) => (
            <div key={number} className="text-center space-y-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto"
                style={{ backgroundColor: appConfig.theme.primaryColor }}
              >
                {number}
              </div>
              <h3 className="font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
