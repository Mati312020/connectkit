import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  name: z.string().min(2, "Nombre requerido").max(100),
  role: z.enum(["PROVIDER", "CLIENT"]),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().regex(/^\+?[\d\s-]{8,15}$/, "Teléfono inválido").optional(),
  bio: z.string().max(1000).optional(),
  hourlyRate: z.number().int().positive().optional(),
  location: z.string().max(200).optional(),
  categories: z.array(z.string()).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
