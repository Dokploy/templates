import os

def test_paperclip_template_exists():
    assert os.path.exists('blueprints/paperclip/template.toml')
    assert os.path.exists('blueprints/paperclip/docker-compose.yml')