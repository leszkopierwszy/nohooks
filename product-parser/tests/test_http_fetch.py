from app.http_fetch import (
    extract_bot_verify_url,
    is_bot_challenge_page,
)
from app.zara_gallery import extract_zara_gallery_urls, zara_product_ref

CHALLENGE_HTML = """<!DOCTYPE html><html><head>
<meta http-equiv="refresh" content="5; URL='/pl/p-test.html?v1=1&bm-verify=ABC123'" />
<script>function triggerInterstitialChallenge(){}</script>
</head><body><iframe src="/interstitial/ic.html"></iframe></body></html>"""

SAMPLE_ZARA_HTML = """
<img src="https://static.zara.net/stdstatic/8.19.0/images/transparent-background.png">
<img src="https://static.zara.net/assets/public/aa/bb/cc/00761323800-a1/00761323800-a1.jpg">
<img src="https://static.zara.net/assets/public/aa/bb/dd/99999999999-a1/99999999999-a1.jpg">
"""


def test_bot_challenge_detection():
    assert is_bot_challenge_page(CHALLENGE_HTML)
    assert not is_bot_challenge_page('<html>' + 'x' * 25_000)


def test_extract_bm_verify_url():
    url = extract_bot_verify_url(
        CHALLENGE_HTML,
        'https://www.zara.com/pl/pl/p-test.html?v1=1',
    )
    assert url is not None
    assert 'bm-verify=ABC123' in url


def test_zara_product_ref():
    assert zara_product_ref(
        'https://www.zara.com/pl/pl/koszulka-p00761323.html?v1=1'
    ) == '00761323'


def test_extract_zara_gallery_filters_by_ref():
    page = 'https://www.zara.com/pl/pl/koszulka-p00761323.html?v1=1'
    urls = extract_zara_gallery_urls(SAMPLE_ZARA_HTML, page)
    assert len(urls) == 1
    assert '00761323800-a1.jpg' in urls[0]
