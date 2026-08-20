// Cloudflare Pages Function: /api/proxy
// Proxies requests to OpenAI-compatible endpoints to avoid CORS restrictions in browsers

export async function onRequest(context: { request: Request; env: any }) {
  const { request, env } = context;

  // Handle CORS preflight for all origins
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key, x-target-url',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: { message: 'Method not allowed' } }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  try {
    const customTarget = request.headers.get('x-target-url');
    let targetUrl = customTarget || env?.VITE_AI_BASE_URL || 'https://api.xkiro.com/v1/chat/completions';

    // Format target URL to ensure it points to /chat/completions
    targetUrl = targetUrl.trim().replace(/\/+$/, '');
    if (!targetUrl.endsWith('/chat/completions')) {
      targetUrl = `${targetUrl}/chat/completions`;
    }

    const authHeader =
      request.headers.get('Authorization') ||
      (env?.VITE_AI_API_KEY ? `Bearer ${env.VITE_AI_API_KEY}` : '');
    const xApiKey =
      request.headers.get('x-api-key') ||
      (authHeader ? authHeader.replace(/^Bearer\s+/i, '') : '');

    const bodyText = await request.text();

    const forwardHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (authHeader) {
      forwardHeaders['Authorization'] = authHeader;
    }
    if (xApiKey) {
      forwardHeaders['x-api-key'] = xApiKey;
    }

    const upstreamResponse = await fetch(targetUrl, {
      method: 'POST',
      headers: forwardHeaders,
      body: bodyText,
    });

    const responseHeaders = new Headers(upstreamResponse.headers);
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, x-api-key, x-target-url'
    );
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: {
          message: `Cloudflare Edge Proxy Error: ${err.message || 'Failed to reach upstream API'}`,
        },
      }),
      {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}
