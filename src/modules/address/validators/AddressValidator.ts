import {z} from 'zod';

export const addressTypes = ['shipping', 'billing', 'both'] as const;

export const createAddressSchema = z.object({
    type: z.enum(addressTypes),
    fullName: z.string().min(1).max(200),
    phoneNumber: z.string().min(1).max(20),
    addressLine1: z.string().min(1).max(255),
    addressLine2: z.string().max(255).optional(),
    city: z.string().min(1).max(100),
    state: z.string().min(1).max(100),
    postalCode: z.string().min(1).max(20),
    country: z.string().min(1).max(100),
    isDefault: z.boolean().optional(),
});

export const updateAddressSchema = z.object({
    type: z.enum(addressTypes).optional(),
    fullName: z.string().min(1).max(200).optional(),
    phoneNumber: z.string().min(1).max(20).optional(),
    addressLine1: z.string().min(1).max(255).optional(),
    addressLine2: z.string().max(255).optional(),
    city: z.string().min(1).max(100).optional(),
    state: z.string().min(1).max(100).optional(),
    postalCode: z.string().min(1).max(20).optional(),
    country: z.string().min(1).max(100).optional(),
    isDefault: z.boolean().optional(),
});

export const addressIdSchema = z.object({
    id: z.string().uuid('Invalid address ID format'),
});
