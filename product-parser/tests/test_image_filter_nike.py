from app.image_filter import filter_product_image_urls


def test_nike_urls_not_collapsed_to_one():
    urls = [
        'https://static.nike.com/a/images/t_default/u_x/fl_layer_apply/aaaaaaaa-1111-1111-1111-111111111111/AIR+FORCE+1+%2707.png',
        'https://static.nike.com/a/images/t_default/u_x/fl_layer_apply/bbbbbbbb-2222-2222-2222-222222222222/AIR+FORCE+1+%2707.png',
        'https://static.nike.com/a/images/t_default/u_x/fl_layer_apply/cccccccc-3333-3333-3333-333333333333/AIR+FORCE+1+%2707.png',
    ]
    out = filter_product_image_urls(urls)
    assert len(out) == 3
