import { z } from 'zod';

export const getLicenseRequestSchema = (t: (key: string) => string, lang?: string) => z.object({
  name: z.string()
    .min(2, t('validation.name_min'))
    .max(100, t('validation.name_max'))
    .refine(val => !/[<>]/.test(val), { message: t('validation.name_invalid') }),

  machineId: z.string()
    .min(1, t('validation.machine_id_required'))
    .max(50, t('validation.machine_id_max'))
    .regex(/^[a-zA-Z0-9]+$/, t('validation.machine_id_alphanumeric')),

  phone: z.string()
    .regex(
      lang?.startsWith('ar') 
        ? /^(0|\+213|00213)[2-7]\d{7,8}$/ 
        : /^\+?[1-9]\d{6,14}$/, 
      t('validation.phone_invalid')
    ),

  shopName: z.string()
    .min(2, t('validation.shop_name_min'))
    .max(100, t('validation.shop_name_max'))
    .refine(val => !/[<>]/.test(val), { message: t('validation.shop_name_invalid') }),

  numberOfCashiers: z.coerce.number()
    .int(t('validation.cashiers_integer'))
    .min(1, t('validation.cashiers_min'))
    .max(50, t('validation.cashiers_max')),

  captchaToken: z.string()
    .min(1, t('validation.captcha_required')),

  website: z.string().max(255).optional()
});

// For type inference
const dummyT = (key: string) => key;
export const licenseRequestSchema = getLicenseRequestSchema(dummyT);
export type LicenseRequestFormValues = z.infer<typeof licenseRequestSchema>;
