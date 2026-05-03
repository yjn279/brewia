import { z } from 'zod'

export const signupSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
})

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
})

export type SignupDto = z.infer<typeof signupSchema>
export type LoginDto = z.infer<typeof loginSchema>
