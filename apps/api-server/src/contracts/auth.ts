import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const refreshSchema = z.object({
  refresh_token: z.string().min(1),
});

export type RefreshInput = z.infer<typeof refreshSchema>;

export const inviteSchema = z.object({
  email: z.string().email(),
  client_id: z.string().uuid(),
  role: z.enum(['Admin', 'Reviewer', 'Contractor']),
  display_name: z.string().min(1).max(200).optional(),
});

export type InviteInput = z.infer<typeof inviteSchema>;

export const inviteActivateSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

export type InviteActivateInput = z.infer<typeof inviteActivateSchema>;

export const switchClientSchema = z.object({
  client_id: z.string().uuid(),
});

export type SwitchClientInput = z.infer<typeof switchClientSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;