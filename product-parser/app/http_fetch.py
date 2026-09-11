from __future__ import annotations

import re
from urllib.parse import urljoin, urlparse

import httpx

MAX_HTML_BYTES = 2 * 1024 * 1024

CHROME_USER_AGENT = (
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
    'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
)

_BOT_CHALLENGE_MARKERS = (
    'bm-verify',
    'interstitial/ic.html',
    'triggerInterstitialChallenge',
)

_ZARA_HOST = re.compile(r'zara\.com', re.I)

_BM_VERIFY_URL = re.compile(
    r"""<meta\s+http-equiv=["']refresh["'][^>]+URL=['"]([^'"]+)['"]""",
    re.I,
)


def browser_headers(page_url: str) -> dict[str, str]:
    parsed = urlparse(page_url)
    origin = f'{parsed.scheme}://{parsed.netloc}'
    segments = [s for s in parsed.path.split('/') if s]
    locale_path = '/'.join(segments[:2]) if len(segments) >= 2 else ''
    referer = f'{origin}/{locale_path}/' if locale_path else f'{origin}/'

    return {
        'User-Agent': CHROME_USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': referer,
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin' if locale_path else 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
    }


def is_bot_challenge_page(html: str) -> bool:
    if len(html) > 20_000:
        return False
    lowered = html.lower()
    return any(marker in lowered for marker in _BOT_CHALLENGE_MARKERS)


def extract_bot_verify_url(html: str, page_url: str) -> str | None:
    match = _BM_VERIFY_URL.search(html)
    if not match:
        return None
    target = match.group(1).replace('&amp;', '&').strip()
    if not target:
        return None
    return urljoin(page_url, target)


async def _maybe_warmup_session(client: httpx.AsyncClient, page_url: str) -> None:
    if not _ZARA_HOST.search(page_url):
        return
    parsed = urlparse(page_url)
    await client.get(f'{parsed.scheme}://{parsed.netloc}/')


async def _get_with_bot_bypass(client: httpx.AsyncClient, page_url: str) -> httpx.Response:
    response = await client.get(page_url)
    if response.status_code == 403:
        await _maybe_warmup_session(client, page_url)
        response = await client.get(page_url)

    if response.status_code >= 400:
        response.raise_for_status()

    html = response.text
    if not is_bot_challenge_page(html):
        return response

    verify_url = extract_bot_verify_url(html, page_url)
    if not verify_url:
        return response

    await client.get(verify_url)
    return await client.get(page_url)


async def fetch_html(url: str) -> str:
    async with httpx.AsyncClient(
        follow_redirects=True,
        timeout=httpx.Timeout(35.0, connect=10.0),
        headers=browser_headers(url),
    ) as client:
        await _maybe_warmup_session(client, url)
        response = await _get_with_bot_bypass(client, url)
        response.raise_for_status()

        content_type = (response.headers.get('content-type') or '').lower()
        if 'html' not in content_type and 'text/' not in content_type:
            raise ValueError('Adres nie zwraca strony HTML (np. to plik graficzny).')

        body = response.content
        if len(body) > MAX_HTML_BYTES:
            body = body[:MAX_HTML_BYTES]
        html = body.decode(response.encoding or 'utf-8', errors='replace')

        if is_bot_challenge_page(html):
            raise ValueError(
                'Sklep zablokował automatyczne pobranie strony (ochrona antybotowa). '
                'Spróbuj ponownie za chwilę lub użyj innego sklepu.'
            )

        return html
