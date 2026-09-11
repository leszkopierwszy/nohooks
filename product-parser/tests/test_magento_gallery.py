from app.magento_gallery import extract_magento_gallery_urls
from app.product_sku import should_apply_sku_filter
from app.store_profiles import resolve_store_image_profile
from bs4 import BeautifulSoup


def test_extract_magento_init_gallery():
    html = """
    <html><body>
    <script type="text/x-magento-init">
    {
      "[data-gallery-role=gallery-placeholder]": {
        "mage/gallery/gallery": {
          "data": [
            {"full": "https://shop.pl/media/catalog/product/65638-01-N0_01.jpg", "thumb": "..."},
            {"full": "https://shop.pl/media/catalog/product/65638-01-N0_03.jpg", "thumb": "..."}
          ]
        }
      }
    }
    </script>
    </body></html>
    """
    soup = BeautifulSoup(html, 'lxml')
    urls = extract_magento_gallery_urls(html, soup, 'https://shop.pl/p/buty')
    assert len(urls) >= 2
    assert any('_03.jpg' in u for u in urls)
    assert all('/cache/' not in u for u in urls)


def test_sku_filter_requires_multiple_matches():
    entries = [
        {'url': 'https://x.pl/media/catalog/product/65638-01-N0_01.jpg'},
        {'url': 'https://x.pl/media/catalog/product/65638-01-N0_03.jpg'},
        {'url': 'https://x.pl/media/catalog/product/other_01.jpg'},
    ]
    assert should_apply_sku_filter(entries, '65638-01-N0') is True
    assert should_apply_sku_filter(entries, '99999-99-ZZ') is False


def test_resolve_kazar_profile():
    html = '<html><div data-gallery-role="gallery-placeholder"></div></html>'
    soup = BeautifulSoup(html, 'lxml')
    profile = resolve_store_image_profile('https://kazar.com/pl/buty', html, soup)
    assert profile.id == 'kazar'
