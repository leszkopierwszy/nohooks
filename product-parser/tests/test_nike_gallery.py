import json
from pathlib import Path

from app.nike_gallery import extract_nike_gallery_urls, upgrade_nike_image_url
from app.store_profiles import resolve_store_image_profile
from bs4 import BeautifulSoup


def test_upgrade_nike_image_url():
    url = (
        'https://static.nike.com/a/images/t_default/u_9ddf04c7/test/'
        'fl_layer_apply/abc-123/shoe.png'
    )
    out = upgrade_nike_image_url(url)
    assert 't_PDP_1728_v1' in out
    assert 't_default' not in out


def test_extract_from_fixture():
    fixture = Path(__file__).parent / 'fixtures' / 'nike_pdp_snippet.html'
    if not fixture.exists():
        return
    html = fixture.read_text()
    soup = BeautifulSoup(html, 'lxml')
    urls = extract_nike_gallery_urls(
        html,
        soup,
        'https://www.nike.com/pl/t/buty-air-force-1-07-DjHm9x/CW2288-111',
    )
    assert len(urls) >= 4


def test_resolve_nike_profile():
    profile = resolve_store_image_profile(
        'https://www.nike.com/pl/t/test/CW2288-111',
        '<html></html>',
        BeautifulSoup('<html></html>', 'lxml'),
    )
    assert profile.id == 'nike'
