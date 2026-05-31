import { appConfig } from "@/config/app.config";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold" style={{ color: appConfig.theme.primaryColor }}>
            {appConfig.name}
          </h1>
          <p className="text-muted-foreground mt-1">{appConfig.tagline}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
