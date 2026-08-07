# Oryx (SRS Stack)

Oryx is an all-in-one video streaming server built on [SRS](https://github.com/ossrs/srs), with a web console for managing streams, recording, forwarding, transcoding and virtual live streaming.

## First login

Open the domain assigned to this service. On the first visit Oryx asks you to **create the admin password** — set it right away, since anyone who reaches the page first can claim the instance. The password (and all other state) is stored in the `oryx-data` volume, so it survives restarts and upgrades.

## Publishing streams

The web console (Scenarios > Streaming) shows ready-to-copy URLs that include your stream secret. The streaming protocols are **not HTTP**, so Traefik cannot route them through your domain — they are published directly on the server's host ports instead. Use the **server IP address** (not the domain) for these:

| Protocol | URL format | Host port |
| --- | --- | --- |
| RTMP (OBS, ffmpeg) | `rtmp://SERVER_IP/live/livestream?secret=xxx` | `1935/tcp` |
| SRT | `srt://SERVER_IP:10080?streamid=#!::r=live/livestream,secret=xxx,m=publish` | `10080/udp` |
| WebRTC (WHIP) | `https://your-domain/rtc/v1/whip/?app=live&stream=livestream&secret=xxx` | signaling via domain, media via `8000/udp` |

Make sure your server firewall / cloud security group allows `1935/tcp`, `8000/udp` and `10080/udp`. Because these are fixed host ports, only one Oryx instance can run per server.

## Playback

HTTP-based playback goes through your domain (HTTPS via Traefik):

- HLS: `https://your-domain/live/livestream.m3u8`
- HTTP-FLV: `https://your-domain/live/livestream.flv`
- WebRTC (WHEP): available from the console's preview page; media flows over `8000/udp`.

If WebRTC playback or publishing connects but produces no media, verify that UDP port `8000` is reachable from the client — WebRTC media bypasses the reverse proxy entirely.
