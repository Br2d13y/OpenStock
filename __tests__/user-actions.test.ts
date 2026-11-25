import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/database/mongoose', () => ({
    connectToDatabase: vi.fn(),
}));

import { connectToDatabase } from '@/database/mongoose';
import { getAllUsersForNewsEmail } from '@/lib/actions/user.actions';

const connectToDatabaseMock = vi.mocked(connectToDatabase);

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

    return { collectionMock, findMock, toArrayMock, db };
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
            expect(findMock).toHaveBeenCalledTimes(1);
            expect(findMock).toHaveBeenCalledWith(getUsersQuery, getUsersProjection);
            expect(toArrayMock).toHaveBeenCalledTimes(1);
            expect(result).toEqual([]);
            expect(console.error).not.toHaveBeenCalled();
        });

        it('maps rows to only id, email and name without leaking extra columns', async () => {
            const rows = [
                {
                    _id: 'mongo_object_1',
                    id: 'user_alpha',
                    email: 'alpha@example.test',
                    name: 'Alpha Tester',
                    country: 'US',
                    createdAt: '2026-01-01T00:00:00.000Z',
                    internalSecret: 'do-not-leak',
                },
                {
                    _id: 'mongo_object_2',
                    email: 'beta@example.test',
                    name: 'Beta Tester',
                    country: 'CA',
                    internalSecret: 'also-do-not-leak',
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
            expect(result).not.toBe(rows);
            expect(result[0]).not.toBe(rows[0]);
        });

        it('filters out rows without an email, blank email or name, matching the source filter', async () => {
            const rows = [
                {
                    _id: 'user_missing_email',
                    id: 'user_missing_email',
                    name: 'Missing Email',
                },
                {
                    _id: 'user_blank_email',
                    id: 'user_blank_email',
                    email: '',
                    name: 'Blank Email',
                },
                {
                    _id: 'user_missing_name',
                    id: 'user_missing_name',
                    email: 'no-name@example.test',
                },
                {
                    _id: 'user_valid',
                    id: 'user_valid',
                    email: 'valid@example.test',
                    name: 'Valid Person',
                },
            ];
            mockDatabase(rows);

            const result = await getAllUsersForNewsEmail();

            expect(result).toEqual([
                {
                    id: 'user_valid',
                    email: 'valid@example.test',
                    name: 'Valid Person',
                },
            ]);
        });

        it('catches a database query error, logs it and returns an empty array', async () => {
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
