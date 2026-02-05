# Netbird Template for Dokploy

## Overview

Netbird is a WireGuard-based mesh VPN and zero-trust networking platform. This template deploys the Netbird management server, signal server, relay, dashboard, and Coturn (TURN server) for use with Dokploy.

## Services

- **netbird-management** – Management API and configuration (HTTPS, port 443)
- **netbird-signal** – Signal exchange server for peer coordination (port 10000)
- **netbird-relay** – Relay service for peer connections (port 33080)
- **netbird-dashboard** – Web UI (port 80)
- **coturn** – TURN server for NAT traversal (runs with `network_mode: host`; uses ports 3478, 5349, and UDP relay range 49152–65535)

## Domain routing

Configure a domain in Dokploy for this deployment. The template assigns:

- **netbird-dashboard** (port 80) – Dashboard UI
- **netbird-management** (port 443) – Management API

Traefik will route traffic to these services by hostname.

## Signal and Relay ports (client connectivity)

Netbird **clients** (desktop, mobile, or other hosts) must be able to reach:

- **Signal:** port **10000** (TCP)
- **Relay:** port **33080** (TCP)

When deploying via Dokploy, these ports are only exposed on the internal Docker network by default. For clients outside the host to connect:

1. **Dokploy / host:** Expose ports 10000 and 33080 on the host (e.g. via Dokploy port settings, firewall rules, or a reverse proxy that forwards TCP to these services), or  
2. Ensure your deployment environment (e.g. cloud security groups, firewall) allows traffic to the host on 10000 and 33080 and that your compose/stack publishes these ports if you are not using Dokploy’s domain-only routing.

Without Signal and Relay reachable from client networks, peers will not be able to establish connections.

## Coturn (TURN)

The **coturn** service runs with `network_mode: host` so the TURN relay can use the full UDP port range (49152–65535) and behave correctly for NAT traversal. No other TURN/STUN service should use the same ports on the host.

## Configuration

Set the required variables in the Dokploy deployment (domain, Let’s Encrypt email, auth client ID/secret, relay auth secret, TURN username/password, etc.) as defined in `template.toml`.
