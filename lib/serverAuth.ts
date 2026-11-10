/**
 * Verify the browser's refresh-token cookie with RiverPen Auth before using its user ID.
 * The SDK's `auth()` helper verifies a locally signed JWT, which is not the token stored here.
 */
export type ServerAuthSession =
    | { status: 'authenticated'; userId: string }
    | { status: 'unauthenticated' }
    | { status: 'unavailable' };

interface AuthServiceOptions {
    authUrl: string;
    clientId?: string;
    clientSecret?: string;
    apiKey?: string;
    fetcher?: (
        input: URL,
        init: { headers: Headers; cache: 'no-store' },
    ) => Promise<{ status: number; ok: boolean; json(): Promise<unknown> }>;
}

function getSessionToken(cookieHeader: string) {
    for (const cookie of cookieHeader.split(';')) {
        const separator = cookie.indexOf('=');
        if (separator < 0 || cookie.slice(0, separator).trim() !== 'riverpen_session') continue;
        return cookie.slice(separator + 1).trim() || null;
    }
    return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function resolveAuthSession(
    requestHeaders: Pick<Headers, 'get'>,
    options: AuthServiceOptions,
): Promise<ServerAuthSession> {
    const cookieHeader = requestHeaders.get('cookie') || '';
    const sessionToken = getSessionToken(cookieHeader);
    if (!sessionToken) return { status: 'unauthenticated' };

    try {
        const headers = new Headers({
            Accept: 'application/json',
            Authorization: `Bearer ${sessionToken}`,
            Cookie: cookieHeader,
        });
        if (options.clientId) headers.set('x-riverpen-client-id', options.clientId);
        if (options.clientSecret) headers.set('x-riverpen-client-secret', options.clientSecret);
        if (options.apiKey) headers.set('x-riverpen-api-key', options.apiKey);

        const response = await (options.fetcher || fetch)(new URL('/api/auth/me', options.authUrl), {
            headers,
            cache: 'no-store',
        });

        if (response.status === 401) {
            return { status: 'unauthenticated' };
        }
        if (!response.ok) return { status: 'unavailable' };

        const payload: unknown = await response.json();
        if (!isRecord(payload) || !('data' in payload)) return { status: 'unavailable' };
        if (payload.data === null) return { status: 'unauthenticated' };
        if (!isRecord(payload.data) || typeof payload.data.id !== 'string' || !payload.data.id.trim()) {
            return { status: 'unavailable' };
        }

        return { status: 'authenticated', userId: payload.data.id };
    } catch {
        return { status: 'unavailable' };
    }
}

export async function getServerAuthSession(requestHeaders?: Headers): Promise<ServerAuthSession> {
    const incomingHeaders = requestHeaders || await (await import('next/headers')).headers();

    return resolveAuthSession(incomingHeaders, {
        authUrl: process.env.RIVERPEN_AUTH_URL
            || process.env.NEXT_PUBLIC_RIVERPEN_AUTH_URL
            || 'http://localhost:3001',
        clientId: process.env.RIVERPEN_CLIENT_ID,
        clientSecret: process.env.RIVERPEN_CLIENT_SECRET,
        apiKey: process.env.RIVERPEN_API_KEY,
    });
}