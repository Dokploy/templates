# Wazuh Template for Dokploy

This template deploys Wazuh, a free and open source security platform that unifies XDR and SIEM capabilities for endpoint and cloud workload protection.

## Components


This single-node deployment includes:
- **Wazuh Manager**: Processes security events from agents and external sources
- **Wazuh Indexer**: Stores and indexes security data (based on OpenSearch)
- **Wazuh Dashboard**: Web interface for visualization and management

## Configuration

The template uses environment variables for all credentials, which are auto-generated securely using Dokploy's password helpers.

## Important Security Notes

⚠️ **This is a simplified deployment for testing and development purposes.**

- This configuration disables SSL/TLS on internal service communication to work within Dokploy's isolated deployment model
- Dokploy handles external SSL/TLS termination at the reverse proxy level
- For production use with sensitive data, consider:
  - Deploying Wazuh using their official installation method with full SSL/TLS
  - Using a dedicated server or VM with proper certificate management
  - Following Wazuh's security hardening guide

## Access

After deployment, access the Wazuh dashboard through the domain configured in Dokploy. The initial setup wizard will guide you through configuring your first security monitoring setup.

## Resources

- [Wazuh Documentation](https://documentation.wazuh.com/)
- [Wazuh GitHub](https://github.com/wazuh/wazuh)
- [Wazuh Docker](https://github.com/wazuh/wazuh-docker)

## Version

- Wazuh Manager: 4.14.1
- Wazuh Indexer: 4.14.1
- Wazuh Dashboard: 4.14.1
