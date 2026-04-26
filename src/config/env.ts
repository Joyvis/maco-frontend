import { envSchema } from './env.schema';

const _env = envSchema.safeParse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
});

if (!_env.success) {
  console.error(
    'Invalid environment variables:',
    _env.error.flatten().fieldErrors,
  );
  throw new Error('Invalid environment variables');
}

export const env = _env.data;
