import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') || '';

  try {
    // ipapi.co — free, reliable, HTTPS supported
    const endpoint = query
      ? `https://ipapi.co/${encodeURIComponent(query)}/json/`
      : `https://ipapi.co/json/`;

    const res = await fetch(endpoint, {
      headers: {
        'User-Agent': 'generate-tools/1.0',
        Accept: 'application/json',
      },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `HTTP ${res.status}` }, { status: res.status });
    }

    const data = await res.json();
    if (data.error) {
      return NextResponse.json({ error: data.reason || 'Introuvable' }, { status: 404 });
    }

    // Normalize to a consistent shape
    const normalized = {
      ip:         data.ip,
      type:       data.version || (data.ip?.includes(':') ? 'IPv6' : 'IPv4'),
      hostname:   data.hostname || null,
      city:       data.city,
      region:     data.region,
      country:    data.country_name,
      country_code: data.country_code,
      postal:     data.postal,
      latitude:   data.latitude,
      longitude:  data.longitude,
      timezone:   { id: data.timezone, utc: data.utc_offset },
      continent:  data.continent_code,
      connection: {
        asn:    data.asn,
        org:    data.org,
        isp:    null,
        domain: null,
      },
      flag: { emoji: data.country_code ? countryToEmoji(data.country_code) : null },
    };

    return NextResponse.json(normalized);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

function countryToEmoji(code) {
  try {
    return code.toUpperCase().replace(/./g, c =>
      String.fromCodePoint(0x1F1E6 - 65 + c.charCodeAt(0))
    );
  } catch { return null; }
}
