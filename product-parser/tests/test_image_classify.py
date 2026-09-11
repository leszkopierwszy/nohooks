from app.image_classify import classify_image_url, image_matches_product_class
from app.product_class import ProductClass, detect_product_class


def test_detect_footwear_from_name():
    assert (
        detect_product_class(name='Męskie buty skórzane Oxfordy', is_footwear=False)
        == ProductClass.FOOTWEAR
    )


def test_reject_bag_on_footwear_product():
    url = 'https://shop.example/media/bag-torebka-front.jpg'
    ok, _ = image_matches_product_class(url, ProductClass.FOOTWEAR)
    assert not ok


def test_allow_shoe_url():
    url = 'https://shop.example/media/sneaker-side-angle.jpg'
    ok, _ = image_matches_product_class(url, ProductClass.FOOTWEAR)
    assert ok


def test_reject_shoe_url_for_clothing():
    url = 'https://shop.example/media/boot-sole-detail.jpg'
    ok, _ = image_matches_product_class(url, ProductClass.CLOTHING)
    assert not ok


def test_classify_mixed_signals():
    found = classify_image_url('https://x.com/shoe-dress-collab.jpg', 'sukienka i buty')
    assert ProductClass.FOOTWEAR in found
    assert ProductClass.CLOTHING in found
