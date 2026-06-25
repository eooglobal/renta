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

export const userRegistrationSchema = z.object({
    email: z.string().email('Invalid email address').toLowerCase(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    firstName: z.string().min(2, 'First name is required').transform(val => val.trim()),
    lastName: z.string().min(2, 'Last name is required').transform(val => val.trim()),
    phone: z.string().regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number format').optional().nullable(),
    role: z.enum(['TENANT', 'LANDLORD', 'SCOUT', 'AFFILIATE']).optional().default('TENANT'),
    ref: z.string().optional().nullable()
});
