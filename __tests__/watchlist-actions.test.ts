import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/database/mongoose', () => ({
    connectToDatabase: vi.fn(),
}));

vi.mock('@/database/models/watchlist.model', () => ({
    Watchlist: {
        findOneAndUpdate: vi.fn(),
        findOneAndDelete: vi.fn(),
        find: vi.fn(),
        findOne: vi.fn(),
    },
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

import { connectToDatabase } from '@/database/mongoose';
import { Watchlist } from '@/database/models/watchlist.model';
import { revalidatePath } from 'next/cache';
import {
    addToWatchlist,
    getUserWatchlist,
    getWatchlistSymbolsByEmail,
    isStockInWatchlist,
    removeFromWatchlist,
} from '@/lib/actions/watchlist.actions';

const connectToDatabaseMock = vi.mocked(connectToDatabase);
const revalidatePathMock = vi.mocked(revalidatePath);
const findOneAndUpdateMock = vi.mocked(Watchlist.findOneAndUpdate);
const findOneAndDeleteMock = vi.mocked(Watchlist.findOneAndDelete);
const findMock = vi.mocked(Watchlist.find);
const findOneMock = vi.mocked(Watchlist.findOne);

describe('watchlist.actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('addToWatchlist', () => {
        it('uppercases symbol in filter and update payload and returns JSON-cloned result', async () => {
            const createdDoc = {
                _id: 'wl_1',
                userId: 'user_alpha',
                symbol: 'ACME',
                company: 'Acme Corp',
                addedAt: new Date('2026-01-01T00:00:00.000Z'),
            };
            findOneAndUpdateMock.mockResolvedValue(createdDoc as never);

            const result = await addToWatchlist('user_alpha', 'acme', 'Acme Corp');

            expect(connectToDatabaseMock).toHaveBeenCalledTimes(1);
            expect(findOneAndUpdateMock).toHaveBeenCalledWith(
                { userId: 'user_alpha', symbol: 'ACME' },
                {
                    userId: 'user_alpha',
                    symbol: 'ACME',
                    company: 'Acme Corp',
                    addedAt: expect.any(Date),
                },
                { upsert: true, new: true },
            );
            expect(revalidatePathMock).toHaveBeenCalledWith('/watchlist');
            expect(result).toEqual(JSON.parse(JSON.stringify(createdDoc)));
            expect(result).not.toBe(createdDoc);
        });

        it('rethrows model failure as Error("Failed to add to watchlist")', async () => {
            findOneAndUpdateMock.mockRejectedValue(new Error('db boom'));

            await expect(addToWatchlist('user_alpha', 'acme', 'Acme Corp')).rejects.toThrow(
                'Failed to add to watchlist',
            );
            expect(revalidatePathMock).not.toHaveBeenCalled();
        });
    });

    describe('removeFromWatchlist', () => {
        it('uppercases symbol and revalidates /watchlist and /', async () => {
            findOneAndDeleteMock.mockResolvedValue({} as never);

            const result = await removeFromWatchlist('user_alpha', 'acme');

            expect(connectToDatabaseMock).toHaveBeenCalledTimes(1);
            expect(findOneAndDeleteMock).toHaveBeenCalledWith({ userId: 'user_alpha', symbol: 'ACME' });
            expect(revalidatePathMock).toHaveBeenCalledTimes(2);
            expect(revalidatePathMock).toHaveBeenCalledWith('/watchlist');
            expect(revalidatePathMock).toHaveBeenCalledWith('/');
            expect(result).toEqual({ success: true });
        });
    });

    describe('getUserWatchlist', () => {
        it('returns [] on failure', async () => {
            const sortMock = vi.fn().mockRejectedValue(new Error('db down'));
            findMock.mockReturnValue({ sort: sortMock } as never);

            const result = await getUserWatchlist('user_alpha');

            expect(result).toEqual([]);
        });

        it('returns JSON-cloned rows on success', async () => {
            const rows = [
                { _id: 'wl_2', userId: 'user_alpha', symbol: 'ZZZZ', addedAt: new Date('2026-02-01T00:00:00.000Z') },
            ];
            const sortMock = vi.fn().mockResolvedValue(rows);
            findMock.mockReturnValue({ sort: sortMock } as never);

            const result = await getUserWatchlist('user_alpha');

            expect(findMock).toHaveBeenCalledWith({ userId: 'user_alpha' });
            expect(sortMock).toHaveBeenCalledWith({ addedAt: -1 });
            expect(result).toEqual(JSON.parse(JSON.stringify(rows)));
            expect(result).not.toBe(rows);
        });
    });

    describe('isStockInWatchlist', () => {
        it('returns true when a document is found', async () => {
            findOneMock.mockResolvedValue({ _id: 'wl_1', symbol: 'ACME' } as never);

            const result = await isStockInWatchlist('user_alpha', 'acme');

            expect(findOneMock).toHaveBeenCalledWith({ userId: 'user_alpha', symbol: 'ACME' });
            expect(result).toBe(true);
        });

        it('returns false when not found', async () => {
            findOneMock.mockResolvedValue(null as never);

            await expect(isStockInWatchlist('user_alpha', 'acme')).resolves.toBe(false);
        });

        it('returns false on error', async () => {
            findOneMock.mockRejectedValue(new Error('db boom'));

            await expect(isStockInWatchlist('user_alpha', 'acme')).resolves.toBe(false);
        });
    });

    describe('getWatchlistSymbolsByEmail', () => {
        it('returns [] for an empty email', async () => {
            const result = await getWatchlistSymbolsByEmail('');

            expect(result).toEqual([]);
            expect(connectToDatabaseMock).not.toHaveBeenCalled();
        });

        it('returns [] when the user lookup misses', async () => {
            const userFindOneMock = vi.fn().mockResolvedValue(null);
            connectToDatabaseMock.mockResolvedValue({
                connection: { db: { collection: vi.fn().mockReturnValue({ findOne: userFindOneMock }) } },
            } as never);

            const result = await getWatchlistSymbolsByEmail('nobody@example.test');

            expect(result).toEqual([]);
            expect(findMock).not.toHaveBeenCalled();
        });

        it('maps symbols using id then _id fallback', async () => {
            const userFindOneMock = vi
                .fn()
                .mockResolvedValueOnce({ id: 'user_id_primary', _id: 'mongo_id_1' })
                .mockResolvedValueOnce({ _id: 'mongo_id_only' });
            connectToDatabaseMock.mockResolvedValue({
                connection: { db: { collection: vi.fn().mockReturnValue({ findOne: userFindOneMock }) } },
            } as never);
            const leanMock = vi
                .fn()
                .mockResolvedValueOnce([{ symbol: 'ACME' }, { symbol: 'BETA' }])
                .mockResolvedValueOnce([{ symbol: 'GAMA' }]);
            findMock.mockReturnValue({ lean: leanMock } as never);

            const byId = await getWatchlistSymbolsByEmail('alpha@example.test');
            const byObjectId = await getWatchlistSymbolsByEmail('beta@example.test');

            expect(findMock).toHaveBeenNthCalledWith(1, { userId: 'user_id_primary' }, { symbol: 1 });
            expect(findMock).toHaveBeenNthCalledWith(2, { userId: 'mongo_id_only' }, { symbol: 1 });
            expect(byId).toEqual(['ACME', 'BETA']);
            expect(byObjectId).toEqual(['GAMA']);
        });
    });
});
