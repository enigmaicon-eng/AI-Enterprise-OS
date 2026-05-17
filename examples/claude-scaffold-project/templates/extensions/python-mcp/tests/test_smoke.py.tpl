from server import hello


def test_hello_smoke():
    assert hello("test") == "hello, test"
    assert hello() == "hello, world"
