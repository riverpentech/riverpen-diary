import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveAuthSession } from './serverAuth.ts';

const authOptions = { authUrl: 'https://auth.example.test' };

test('does not call the auth service when the session cookie is absent', async () => {
    const result = await resolveAuthSession(new Headers({ cookie: 'theme=light' }), {
        ...authOptions,
        fetcher: async () => {
            throw new Error('fetch should not be called');
        },
    });

    assert.deepEqual(result, { status: 'unauthenticated' });
});

test('forwards the browser cookie and service credentials and validates the returned user ID', async () => {
    let requestUrl;
    let requestOptions;
    const result = await resolveAuthSession(
        new Headers({ cookie: 'riverpen_session=refresh-token; theme=light' }),
        {
            ...authOptions,
            clientId: 'client-id',
            clientSecret: 'client-secret',
            apiKey: 'api-key',
            fetcher: async (url, options) => {
                requestUrl = url;
                requestOptions = options;
                return new Response(JSON.stringify({ success: true, data: { id: 'user-42' } }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                });
            },
        },
    );

    assert.equal(requestUrl.href, 'https://auth.example.test/api/auth/me');
    assert.equal(requestOptions.cache, 'no-store');
    assert.equal(requestOptions.headers.get('authorization'), 'Bearer refresh-token');
    assert.equal(requestOptions.headers.get('cookie'), 'riverpen_session=refresh-token; theme=light');
    assert.equal(requestOptions.headers.get('x-riverpen-client-id'), 'client-id');
    assert.equal(requestOptions.headers.get('x-riverpen-client-secret'), 'client-secret');
    assert.equal(requestOptions.headers.get('x-riverpen-api-key'), 'api-key');
    assert.deepEqual(result, { status: 'authenticated', userId: 'user-42' });
});

test('treats an explicit unauthorized response as a signed-out session', async () => {
    const result = await resolveAuthSession(new Headers({ cookie: 'riverpen_session=expired' }), {
        ...authOptions,
        fetcher: async () => new Response(null, { status: 401 }),
    });

    assert.deepEqual(result, { status: 'unauthenticated' });
});

test('treats an empty authenticated user response as a signed-out session', async () => {
    const result = await resolveAuthSession(new Headers({ cookie: 'riverpen_session=expired' }), {
        ...authOptions,
        fetcher: async () => new Response(JSON.stringify({ success: false, data: null }), { status: 200 }),
    });

    assert.deepEqual(result, { status: 'unauthenticated' });
});

test('reports malformed auth responses as unavailable instead of signed out', async () => {
    const malformedJson = await resolveAuthSession(new Headers({ cookie: 'riverpen_session=token' }), {
        ...authOptions,
        fetcher: async () => new Response('{not-json', { status: 200 }),
    });
    const malformedUser = await resolveAuthSession(new Headers({ cookie: 'riverpen_session=token' }), {
        ...authOptions,
        fetcher: async () => new Response(JSON.stringify({ success: true, data: {} }), { status: 200 }),
    });

    assert.deepEqual(malformedJson, { status: 'unavailable' });
    assert.deepEqual(malformedUser, { status: 'unavailable' });
});

test('reports service and network failures as unavailable', async () => {
    const unavailableResponse = await resolveAuthSession(new Headers({ cookie: 'riverpen_session=token' }), {
        ...authOptions,
        fetcher: async () => new Response(null, { status: 503 }),
    });
    const forbiddenResponse = await resolveAuthSession(new Headers({ cookie: 'riverpen_session=token' }), {
        ...authOptions,
        fetcher: async () => new Response(null, { status: 403 }),
    });
    const networkFailure = await resolveAuthSession(new Headers({ cookie: 'riverpen_session=token' }), {
        ...authOptions,
        fetcher: async () => {
            throw new Error('auth service is unreachable');
        },
    });

    assert.deepEqual(unavailableResponse, { status: 'unavailable' });
    assert.deepEqual(forbiddenResponse, { status: 'unavailable' });
    assert.deepEqual(networkFailure, { status: 'unavailable' });
});