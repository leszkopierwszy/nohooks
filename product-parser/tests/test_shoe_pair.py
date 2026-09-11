from app.image_pixels import _dual_fg_runs


def test_dual_fg_runs_two_separated_peaks():
    width = 200
    proj = [0] * width
    for x in range(30, 80):
        proj[x] = 40
    for x in range(120, 170):
        proj[x] = 45
    assert _dual_fg_runs(proj, width, fg=5000) is True


def test_dual_fg_runs_single_blob():
    width = 100
    proj = [0] * width
    for x in range(35, 65):
        proj[x] = 50
    assert _dual_fg_runs(proj, width, fg=2000) is False
