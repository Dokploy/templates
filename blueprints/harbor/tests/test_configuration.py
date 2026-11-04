import shlex
import sys
import tempfile
import unittest
from unittest.mock import patch, Mock

sys.path.insert(0, '/app')
from common import ConfigError, settings, operation_lock
from initialize import (build_config, check_persistent_state, launcher, parse_literal_env,
                        require_stopped_services)

BASE = {'HARBOR_INSTANCE_ID': 'harbor-test', 'HARBOR_HOSTNAME': 'registry.company.test',
        'HARBOR_ADMIN_PASSWORD': 'admin-with-20-characters',
        'HARBOR_DB_PASSWORD': 'database-with-20-characters'}
TEMPLATE = {'database': {}, 'jobservice': {}, 'log': {'local': {}}, 'trivy': {}}


class ConfigurationTests(unittest.TestCase):
    def test_minimal_configuration_needs_no_backup_credentials(self):
        self.assertEqual(settings(BASE), {'instance': 'harbor-test', 'external_url': 'https://registry.company.test'})

    def test_invalid_hosts_and_instances(self):
        for host in ['localhost', '127.0.0.1', 'https://registry.company.test', 'registry.company.test:443',
                     'registry.company.test/path', 'a..test', 'HOST.company.test', 'harbor.example.com']:
            with self.subTest(host=host), self.assertRaises(ConfigError):
                settings({**BASE, 'HARBOR_HOSTNAME': host})
        for instance in ['../data', 'harbor_prod', 'Xprod', 'ab']:
            with self.subTest(instance=instance), self.assertRaises(ConfigError):
                settings({**BASE, 'HARBOR_INSTANCE_ID': instance})

    def test_password_validation(self):
        for password in ['', 'Harbor12345', 'short', 'long-password-with\nnewline']:
            with self.subTest(password=password), self.assertRaises(ConfigError):
                build_config({**BASE, 'HARBOR_DB_PASSWORD': password}, TEMPLATE)

    def test_security_and_trivy_defaults(self):
        conf = build_config(BASE, TEMPLATE)
        self.assertEqual(conf['external_url'], 'https://registry.company.test')
        self.assertNotIn('https', conf)
        self.assertFalse(conf['x-dokploy-security']['self_registration'])
        self.assertEqual(conf['x-dokploy-security']['project_creation_restriction'], 'adminonly')
        self.assertFalse(conf['trivy']['skip_update'])
        self.assertFalse(conf['trivy']['insecure'])
        self.assertEqual(TEMPLATE['database'], {})

    def test_special_characters_remain_literal(self):
        secret = "space $TOKEN $(touch /tmp/injected) # \" ' \\ ="
        parsed = parse_literal_env('PASSWORD=' + secret + '\nEMPTY=\nURL=a=b#c\n')
        script = launcher(parsed, ['/some executable', 'literal;$HOME'])
        line = next(line for line in script.splitlines() if line.startswith('export PASSWORD='))
        self.assertEqual(shlex.split(line), ['export', 'PASSWORD=' + secret])
        self.assertEqual(parsed['URL'], 'a=b#c')
        self.assertNotIn('eval ', script)

    def test_invalid_upstream_env_is_rejected(self):
        for value in ['BAD-KEY=x', 'export X=x', 'NO_EQUALS', 'KEY=bad\x00value']:
            with self.subTest(value=value), self.assertRaises(ConfigError):
                parse_literal_env(value)

    def test_connection_pool_bounds(self):
        for extra in [{'DB_MAX_IDLE_CONNS': '11', 'DB_MAX_OPEN_CONNS': '10'},
                      {'POSTGRES_MAX_CONNECTIONS': '100'}, {'DB_MAX_OPEN_CONNS': 'NaN'}]:
            with self.subTest(extra=extra), self.assertRaises(ConfigError):
                build_config({**BASE, **extra}, TEMPLATE)

    def test_unchanged_and_first_install_are_allowed(self):
        runtime = settings(BASE)
        check_persistent_state(None, runtime, 'digest', False, False, False, False)
        check_persistent_state({'instance': 'harbor-test', 'fingerprint': 'digest'},
                               runtime, 'digest', True, True, True, False)

    def test_changed_config_requires_explicit_reconfiguration(self):
        old = {'instance': 'harbor-test', 'fingerprint': 'old'}
        with self.assertRaisesRegex(ConfigError, '--reconfigure'):
            check_persistent_state(old, settings(BASE), 'new', True, True, True, False)
        check_persistent_state(old, settings(BASE), 'new', True, True, True, True)

    def test_missing_keys_never_regenerated_even_when_reconfiguring(self):
        old = {'instance': 'harbor-test', 'fingerprint': 'old'}
        for state in [None, old]:
            for reconfigure in [False, True]:
                with self.subTest(state=state, reconfigure=reconfigure), self.assertRaisesRegex(ConfigError, 'keys are missing'):
                    check_persistent_state(state, settings(BASE), 'new', False, True, False, reconfigure)

    def test_existing_volume_cannot_change_instance(self):
        with self.assertRaisesRegex(ConfigError, 'INSTANCE_ID'):
            check_persistent_state({'instance': 'other', 'fingerprint': 'old'},
                                   settings(BASE), 'new', True, True, True, True)

    @patch('initialize.socket.create_connection')
    def test_reconfiguration_refuses_live_workloads(self, connect):
        connection = Mock()
        connect.return_value = connection
        with self.assertRaisesRegex(ConfigError, 'Stop all Harbor'):
            require_stopped_services()
        connection.close.assert_called_once()

    @patch('initialize.socket.create_connection', side_effect=ConnectionRefusedError)
    def test_stopped_workloads_allow_reconfiguration(self, connect):
        require_stopped_services()
        self.assertEqual(connect.call_count, 10)

    def test_concurrent_initialization_is_rejected(self):
        with tempfile.TemporaryDirectory() as folder:
            with operation_lock(folder):
                with self.assertRaisesRegex(ConfigError, 'Another initialization'):
                    with operation_lock(folder):
                        self.fail('Concurrent initialization allowed')


if __name__ == '__main__':
    unittest.main()
