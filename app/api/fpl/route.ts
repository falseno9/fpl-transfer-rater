import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path');
  
  if (!path) {
    return NextResponse.json({ error: 'Path is required' }, { status: 400 });
  }

  try {
    const fetchOptions: RequestInit = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      }
    };

    // The bootstrap-static endpoint is >2MB, which exceeds Next.js's data cache limit.
    // We disable caching for it to prevent cache errors.
    if (path === 'bootstrap-static/') {
      fetchOptions.cache = 'no-store';
    } else {
      fetchOptions.next = { revalidate: 60 };
    }

    const response = await fetch(`https://fantasy.premierleague.com/api/${path}`, fetchOptions);
    
    if (!response.ok) {
      throw new Error(`FPL API responded with ${response.status}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('FPL API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch FPL data' }, { status: 500 });
  }
}
