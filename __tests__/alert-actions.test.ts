import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/database/mongoose', () => ({
    connectToDatabase: vi.fn(),
}));

vi.mock('@/database/models/alert.model', () => ({
    Alert: {
        create: vi.fn(),
        find: vi.fn(),
        findByIdAndDelete: vi.fn(),
        findByIdAndUpdate: vi.fn(),
    },
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

import { connectToDatabase } from '@/database/mongoose';
import { Alert } from '@/database/models/alert.model';
import { revalidatePath } from 'next/cache';
import {
    createAlert,
    deleteAlert,
    getUserAlerts,
    toggleAlert,
} from '@/lib/actions/alert.actions';

const connectToDatabaseMock = vi.mocked(connectToDatabase);
const revalidatePathMock = vi.mocked(revalidatePath);
const alertCreateMock = vi.mocked(Alert.create);
const alertFindMock = vi.mocked(Alert.find);
const alertFindByIdAndDeleteMock = vi.mocked(Alert.findByIdAndDelete);
const alertFindByIdAndUpdateMock = vi.mocked(Alert.findByIdAndUpdate);

describe('alert.actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('createAlert', () => {
        it('forwards every supplied field to the model and returns the JSON-cloned document', async () => {
            const params = {
                userId: 'user_test_42',
                symbol: 'ACME',
                targetPrice: 123.45,
                condition: 'ABOVE' as const,
            };
            const createdDoc = {
                _id: 'alert_1',
                ...params,
                active: true,
                createdAt: new Date('2026-01-01T00:00:00.000Z'),
            };
            alertCreateMock.mockResolvedValue(createdDoc as never);

            const result = await createAlert(params);

            expect(connectToDatabaseMock).toHaveBeenCalledTimes(1);
            expect(alertCreateMock).toHaveBeenCalledWith({
                userId: 'user_test_42',
                symbol: 'ACME',
                targetPrice: 123.45,
                condition: 'ABOVE',
                active: true,
            });
            expect(result).toEqual(JSON.parse(JSON.stringify(createdDoc)));
            expect(result).not.toBe(createdDoc);
            expect(revalidatePathMock).toHaveBeenCalledTimes(1);
            expect(revalidatePathMock).toHaveBeenCalledWith('/watchlist');
        });

        it('rethrows the same user-facing Error message on create failure', async () => {
            alertCreateMock.mockRejectedValue(new Error('db boom'));

            await expect(
                createAlert({
                    userId: 'user_test_99',
                    symbol: 'ZZZZ',
                    targetPrice: 9.99,
                    condition: 'BELOW',
                })
            ).rejects.toThrow('Failed to create alert');

            expect(revalidatePathMock).not.toHaveBeenCalled();
        });
    });

    describe('getUserAlerts', () => {
        it('returns JSON-cloned rows in the source sort order on success', async () => {
            const rows = [
                { _id: 'a2', userId: 'user_test_42', symbol: 'ACME', createdAt: new Date('2026-02-01T00:00:00.000Z') },
                { _id: 'a1', userId: 'user_test_42', symbol: 'BETA', createdAt: new Date('2026-01-01T00:00:00.000Z') },
            ];
            const sortMock = vi.fn().mockResolvedValue(rows);
            alertFindMock.mockReturnValue({ sort: sortMock } as never);

            const result = await getUserAlerts('user_test_42');

            expect(connectToDatabaseMock).toHaveBeenCalledTimes(1);
            expect(alertFindMock).toHaveBeenCalledWith({ userId: 'user_test_42' });
            expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
            expect(result).toEqual(JSON.parse(JSON.stringify(rows)));
            expect(result).not.toBe(rows);
            expect(revalidatePathMock).not.toHaveBeenCalled();
        });

        it('returns [] on failure', async () => {
            const sortMock = vi.fn().mockRejectedValue(new Error('db down'));
            alertFindMock.mockReturnValue({ sort: sortMock } as never);

            const result = await getUserAlerts('user_test_42');

            expect(result).toEqual([]);
            expect(revalidatePathMock).not.toHaveBeenCalled();
        });
    });

    describe('deleteAlert', () => {
        it('returns success true and revalidates watchlist', async () => {
            alertFindByIdAndDeleteMock.mockResolvedValue({} as never);

            const result = await deleteAlert('alert_test_1');

            expect(connectToDatabaseMock).toHaveBeenCalledTimes(1);
            expect(alertFindByIdAndDeleteMock).toHaveBeenCalledWith('alert_test_1');
            expect(result).toEqual({ success: true });
            expect(revalidatePathMock).toHaveBeenCalledTimes(1);
            expect(revalidatePathMock).toHaveBeenCalledWith('/watchlist');
        });

        it('rethrows a wrapped Error on failure', async () => {
            alertFindByIdAndDeleteMock.mockRejectedValue(new Error('db boom'));

            await expect(deleteAlert('alert_test_1')).rejects.toThrow('Failed to delete alert');
            expect(revalidatePathMock).not.toHaveBeenCalled();
        });
    });

    describe('toggleAlert', () => {
        it('passes the active flag through and revalidates watchlist', async () => {
            alertFindByIdAndUpdateMock.mockResolvedValue({} as never);

            const result = await toggleAlert('alert_test_2', false);

            expect(connectToDatabaseMock).toHaveBeenCalledTimes(1);
            expect(alertFindByIdAndUpdateMock).toHaveBeenCalledWith('alert_test_2', { active: false });
            expect(result).toEqual({ success: true });
            expect(revalidatePathMock).toHaveBeenCalledTimes(1);
            expect(revalidatePathMock).toHaveBeenCalledWith('/watchlist');
        });

        it('rethrows a wrapped Error on failure', async () => {
            alertFindByIdAndUpdateMock.mockRejectedValue(new Error('db boom'));

            await expect(toggleAlert('alert_test_2', true)).rejects.toThrow('Failed to update alert');
            expect(revalidatePathMock).not.toHaveBeenCalled();
        });
    });
});