import os

def test_wud_template_exists():
    path = 'templates/wud/docker-compose.yml'
    assert os.path.exists(path), f'File {path} should exist'

def test_wud_template_content():
    path = 'templates/wud/docker-compose.yml'
    with open(path, 'r') as f:
        content = f.read()
    # Verify key components of the template
    assert 'image: getwud/wud:latest' in content
    assert 'WUD_WATCHER_LOCAL_SOCKET: /var/run/docker.sock' in content
    assert 'WUD_AUTH_ADMIN_USER: ${WUD_AUTH_ADMIN_USER}' in content
    assert 'wud_data:/store' in content
    assert 'restart: unless-stopped' in content
    assert 'volumes:' in content
    assert 'wud_data:' in content