import { z } from 'zod';

export const registerSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, 'Username must be at least 3 characters long')
      .max(20, 'Username cannot exceed 20 characters')
      .regex(
        /^[a-zA-Z0-9_]+$/,
        'Username can only contain alphanumeric characters and underscores'
      ),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Please provide a valid email address')
      .max(100, 'Email cannot exceed 100 characters'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .max(128, 'Password cannot exceed 128 characters'),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.confirmPassword !== undefined) {
        return data.password === data.confirmPassword;
      }
      return true;
    },
    {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    }
  );

export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(3, 'Identifier must be at least 3 characters long')
    .max(100, 'Identifier cannot exceed 100 characters'),
  password: z.string().min(1, 'Password is required'),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters long')
      .max(128, 'New password cannot exceed 128 characters'),
    confirmNewPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.confirmNewPassword !== undefined) {
        return data.newPassword === data.confirmNewPassword;
      }
      return true;
    },
    {
      message: 'New passwords do not match',
      path: ['confirmNewPassword'],
    }
  );

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
