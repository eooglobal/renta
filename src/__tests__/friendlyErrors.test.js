import { friendlyError } from '@/lib/errors';

describe('Friendly Error Message Resolver', () => {
    test('Translates NextAuth CredentialsSignin to clear user-friendly error', () => {
        const res = friendlyError('CredentialsSignin');
        expect(res.title).toBe('Incorrect Email or Password');
        expect(res.message).toContain('email address or password you entered is wrong');
    });

    test('Translates NextAuth Configuration to clear user-friendly error', () => {
        const res = friendlyError('Configuration');
        expect(res.title).toBe('Incorrect Email or Password');
        expect(res.message).toContain('email address or password you entered is wrong');
    });

    test('Translates duplicate email error', () => {
        const res = friendlyError('An account with this email already exists');
        expect(res.title).toBe('Email Already Registered');
        expect(res.message).toContain('already linked to a Renta account');
    });

    test('Translates duplicate phone error', () => {
        const res = friendlyError('An account with this phone number already exists');
        expect(res.title).toBe('Phone Number Already Used');
        expect(res.message).toContain('already linked to another Renta account');
    });

    test('Translates rate limit error', () => {
        const res = friendlyError('Too many login attempts. Please try again later.');
        expect(res.title).toBe('Too Many Attempts');
        expect(res.message).toContain('Too many login attempts');
    });

    test('Translates account suspended error', () => {
        const res = friendlyError('Your account has been suspended. Contact support.');
        expect(res.title).toBe('Account Suspended');
        expect(res.message).toContain('suspended or restricted');
    });
});
