import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/better-auth/auth', () => ({
    auth: {
        api: {
            signUpEmail: vi.fn(),
            signInEmail: vi.fn(),
            requestPasswordReset: vi.fn(),
            resetPassword: vi.fn(),
            signOut: vi.fn(),
        },
    },
}));

vi.mock('@/lib/inngest/client', () => ({
    inngest: {
        send: vi.fn(),
    },
}));

vi.mock('next/headers', () => ({
    headers: vi.fn(),
}));

vi.mock('@/database/mongoose', () => ({
    connectToDatabase: vi.fn(),
}));

import { auth } from '@/lib/better-auth/auth';
import { inngest } from '@/lib/inngest/client';
import {
    requestPasswordResetEmail,
    resetPasswordWithToken,
    signInWithEmail,
    signUpWithEmail,
} from '@/lib/actions/auth.actions';

const authApi = auth.api;
const signUpEmailMock = vi.mocked(authApi.signUpEmail);
const signInEmailMock = vi.mocked(authApi.signInEmail);
const requestPasswordResetMock = vi.mocked(authApi.requestPasswordReset);
const resetPasswordMock = vi.mocked(authApi.resetPassword);
const signOutMock = vi.mocked(authApi.signOut);
const inngestSendMock = vi.mocked(inngest.send);

describe('auth.actions', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        process.env = {
            ...originalEnv,
            NODEMAILER_EMAIL: 'sender@example.com',
            NODEMAILER_PASSWORD: 'secret-password',
        };
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        process.env = { ...originalEnv };
        vi.restoreAllMocks();
        vi.unstubAllEnvs();
    });

    describe('requestPasswordResetEmail', () => {
        it('returns not-configured error when mail env vars are missing and skips auth call', async () => {
            delete process.env.NODEMAILER_EMAIL;
            delete process.env.NODEMAILER_PASSWORD;

            const result = await requestPasswordResetEmail({ email: 'user@example.com' });

            expect(result).toEqual({ success: false, error: 'Password reset email is not configured.' });
            expect(requestPasswordResetMock).not.toHaveBeenCalled();
        });

        it('returns BETTER_AUTH_URL error in production when base url is unset', async () => {
            vi.stubEnv('NODE_ENV', 'production');
            delete process.env.BETTER_AUTH_URL;

            const result = await requestPasswordResetEmail({ email: 'user@example.com' });

            expect(result).toEqual({
                success: false,
                error: 'BETTER_AUTH_URL must be configured before password reset emails can be sent.',
            });
            expect(requestPasswordResetMock).not.toHaveBeenCalled();
        });

        it('passes redirectTo of base URL plus /reset-password on happy path', async () => {
            process.env.BETTER_AUTH_URL = 'https://app.example.com';
            requestPasswordResetMock.mockResolvedValue({ success: true } as never);

            const result = await requestPasswordResetEmail({ email: 'user@example.com' });

            expect(requestPasswordResetMock).toHaveBeenCalledWith({
                body: { email: 'user@example.com', redirectTo: 'https://app.example.com/reset-password' },
            });
            expect(result).toEqual({ success: true });
        });
    });

    describe('signUpWithEmail', () => {
        it('still returns success when inngest send rejects', async () => {
            const response = { user: { id: 'user_1', email: 'user@example.com' } };
            signUpEmailMock.mockResolvedValue(response as never);
            inngestSendMock.mockRejectedValue(new Error('inngest down'));

            const result = await signUpWithEmail({
                email: 'user@example.com',
                password: 'Password123!',
                fullName: 'Test User',
                country: 'US',
                investmentGoals: 'Growth',
                riskTolerance: 'Moderate',
                preferredIndustry: 'Technology',
            });

            expect(signUpEmailMock).toHaveBeenCalledWith({
                body: { email: 'user@example.com', password: 'Password123!', name: 'Test User' },
            });
            expect(inngestSendMock).toHaveBeenCalledWith({
                name: 'app/user.created',
                data: {
                    email: 'user@example.com',
                    name: 'Test User',
                    country: 'US',
                    investmentGoals: 'Growth',
                    riskTolerance: 'Moderate',
                    preferredIndustry: 'Technology',
                },
            });
            expect(result).toEqual({ success: true, data: response });
        });
    });

    describe('signInWithEmail', () => {
        it('returns sign in failed error when auth api throws', async () => {
            signInEmailMock.mockRejectedValue(new Error('invalid credentials'));

            const result = await signInWithEmail({ email: 'user@example.com', password: 'WrongPassword1!' });

            expect(result).toEqual({ success: false, error: 'Sign in failed' });
        });
    });

    describe('resetPasswordWithToken', () => {
        it('returns invalid or expired error when reset fails', async () => {
            resetPasswordMock.mockRejectedValue(new Error('bad token'));

            const result = await resetPasswordWithToken({ token: 'reset-token-123', newPassword: 'NewPassword123!' });

            expect(result).toEqual({ success: false, error: 'Reset link is invalid or expired.' });
            expect(resetPasswordMock).toHaveBeenCalledWith({
                body: { token: 'reset-token-123', newPassword: 'NewPassword123!' },
            });
        });
    });
});
