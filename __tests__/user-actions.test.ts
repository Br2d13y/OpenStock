import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/database/mongoose', () => ({
    connectToDatabase: vi.fn(),
}));

import { connectToDatabase } from '@/database/mongoose';
import { getAllUsersForNewsEmail } from '@/lib/actions/user.actions';

const connectToDatabaseMock = vi.mocked(connectToDatabase);

// Matches the exact query/projection in lib/actions/user.actions.ts
const getUsersQuery = {
    email: { $exists: true, $ne: null },
};

const getUsersProjection = {
    projection: { _id: 1, id: 1, email: 1, name: 1, country: 1 },
};

function mockDatabase(rows: unknown[] | Error) {
    const toArrayMock =
        rows instanceof Error
            ? vi.fn().mockRejectedValue(rows)
            : vi.fn().mockResolvedValue(rows);
    const findMock = vi.fn().mockReturnValue({ toArray: toArrayMock });
    const collectionMock = vi.fn().mockReturnValue({ find: findMock });
    const db = { collection: collectionMock };

    connectToDatabaseMock.mockResolvedValue({ connection: { db } } as never);

    return { collectionMock, findMock, toArrayMock };
}

describe('user.actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('getAllUsersForNewsEmail', () => {
        it('returns an empty array when the query resolves no rows', async () => {
            const { collectionMock, findMock, toArrayMock } = mockDatabase([]);

            const result = await getAllUsersForNewsEmail();

            expect(connectToDatabaseMock).toHaveBeenCalledTimes(1);
            expect(collectionMock).toHaveBeenCalledWith('user');
            expect(findMock).toHaveBeenCalledWith(getUsersQuery, getUsersProjection);
            expect(toArrayMock).toHaveBeenCalledTimes(1);
            expect(result).toEqual([]);
            expect(console.error).not.toHaveBeenCalled();
        });

        it('maps rows to {id, email, name} only, using id or _id fallback as in source', async () => {
            // Projection requests country, but the source maps to only id/email/name.
            const rows = [
                {
                    _id: 'mongo_object_1',
                    id: 'user_alpha',
                    email: 'alpha@example.test',
                    name: 'Alpha Tester',
                    country: 'US',
                    internalNote: 'do-not-leak',
                },
                {
                    _id: { toString: () => 'mongo_object_2' },
                    email: 'beta@example.test',
                    name: 'Beta Tester',
                    country: 'CA',
                },
            ];
            mockDatabase(rows);

            const result = await getAllUsersForNewsEmail();

            expect(result).toEqual([
                {
                    id: 'user_alpha',
                    email: 'alpha@example.test',
                    name: 'Alpha Tester',
                },
                {
                    id: 'mongo_object_2',
                    email: 'beta@example.test',
                    name: 'Beta Tester',
                },
            ]);
            expect(Object.keys(result[0])).toEqual(['id', 'email', 'name']);
            expect(Object.keys(result[1])).toEqual(['id', 'email', 'name']);
        });

        it('filters rows missing email or name, matching source filter (user.email && user.name)', async () => {
            const rows = [
                {
                    _id: 'row_missing_email',
                    id: 'row_missing_email',
                    name: 'Missing Email',
                    country: 'US',
                },
                {
                    _id: 'row_blank_email',
                    id: 'row_blank_email',
                    email: '',
                    name: 'Blank Email',
                    country: 'US',
                },
                {
                    _id: 'row_missing_name',
                    id: 'row_missing_name',
                    email: 'noname@example.test',
                    country: 'US',
                },
                {
                    _id: 'row_valid',
                    id: 'row_valid',
                    email: 'valid@example.test',
                    name: 'Valid Person',
                    country: 'US',
                },
            ];
            mockDatabase(rows);

            const result = await getAllUsersForNewsEmail();

            expect(result).toEqual([
                {
                    id: 'row_valid',
                    email: 'valid@example.test',
                    name: 'Valid Person',
                },
            ]);
        });

        it('catches database errors, logs them, and returns an empty array', async () => {
            const dbError = new Error('db boom');
            mockDatabase(dbError);

            const result = await getAllUsersForNewsEmail();

            expect(result).toEqual([]);
            expect(console.error).toHaveBeenCalledTimes(1);
            expect(console.error).toHaveBeenCalledWith(
                'Error fetching users for news email:',
                dbError,
            );
        });
    });
});
