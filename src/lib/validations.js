import { z } from 'zod';

// Property Types Match Schema
const propertyTypeEnum = z.enum(['SELF_CON', 'SINGLE_ROOM', 'FLAT', 'TWO_BEDROOM', 'THREE_BEDROOM']);

export const propertyCreationSchema = z.object({
    title: z.string().min(5, 'Title must be at least 5 characters').max(100).transform(val => val.trim()),
    description: z.string().min(20, 'Description must be at least 20 characters').transform(val => z.string().parse(val).trim()),
    rentPrice: z.union([z.string(), z.number()]).transform(val => parseFloat(val)).refine(val => val > 0, "Rent price must be greater than zero"),
    type: propertyTypeEnum,
    address: z.string().min(10, 'Address must be at least 10 characters'),
    cityId: z.union([z.string(), z.number()]).transform(val => parseInt(val, 10)),
    areaId: z.union([z.string(), z.number()]).transform(val => {
        if (val === 'other' || val === 'OTHER') return 'other';
        return parseInt(val, 10);
    }),
    otherAreaName: z.string().optional().nullable(),
    nearestBusStop: z.string().optional().nullable(),
    latitude: z.union([z.string(), z.number()]).transform(val => parseFloat(val)).optional().nullable(),
    longitude: z.union([z.string(), z.number()]).transform(val => parseFloat(val)).optional().nullable(),
    amenities: z.array(z.string()).optional().default([]),
    studentFriendly: z.boolean().optional().default(false),
    uploadLatitude: z.number().optional().nullable(),
    uploadLongitude: z.number().optional().nullable(),
});

export function normalizePhone(phone) {
    if (!phone) return '';
    // Strip spaces, hyphens, brackets
    let digits = String(phone).replace(/[^0-9]/g, '');

    // Handle 234 country code prefix (e.g. 2348031234567 -> 08031234567)
    if (digits.startsWith('234') && digits.length === 13) {
        digits = '0' + digits.slice(3);
    }
    // Handle 10-digit number missing leading 0 (e.g. 8031234567 -> 08031234567)
    if (digits.length === 10 && ['7', '8', '9'].includes(digits[0])) {
        digits = '0' + digits;
    }

    return digits;
}

export const userRegistrationSchema = z.object({
    email: z.string({ required_error: 'Email address is required' }).email('Invalid email address').toLowerCase(),
    password: z.string({ required_error: 'Password is required' }).min(8, 'Password must be at least 8 characters'),
    firstName: z.string({ required_error: 'First name is required' }).min(2, 'First name is required').transform(val => val.trim()),
    lastName: z.string({ required_error: 'Last name is required' }).min(2, 'Last name is required').transform(val => val.trim()),
    phone: z.string({ required_error: 'Phone number is required' })
        .min(1, 'Phone number is required')
        .transform(val => normalizePhone(val))
        .refine(val => /^0[789][01]\d{8}$/.test(val), {
            message: 'Please enter a valid 11-digit phone number (e.g. 08031234567).'
        }),
    role: z.enum(['TENANT', 'LANDLORD', 'SCOUT', 'AFFILIATE']).optional().default('TENANT'),
    ref: z.string().optional().nullable()
});
