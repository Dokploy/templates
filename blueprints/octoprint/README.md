# OctoPrint

Runs [OctoPrint](https://octoprint.org) — the web interface for your 3D
printer. Control and monitor prints remotely, upload G-code, watch print
progress and webcam feeds, and extend it with plugins, all from the browser.
The template deploys the official `octoprint/octoprint` image and exposes the
web UI on your Dokploy domain (the service listens on port 5000 internally).

Tested on Dokploy: deployed live and verified — OctoPrint 1.13.0 loads
over HTTPS on the Dokploy domain, the first-run setup wizard was completed
and the main control UI reached (it reports "No serial port found" until a
printer is connected over USB, as expected on a server).

## First run

1. Open your domain — the setup wizard walks you through creating the admin
   account and (optionally) setting up printer access. **No printer is needed
   to try the UI**: the wizard and dashboard load fine without one attached.
2. Upload a G-code file or connect your printer to start a print.

## Connecting a real printer

To control a printer over USB, the container needs the printer's serial
device passed through — add a `devices` entry to the compose file, for
example `- /dev/ttyUSB0:/dev/ttyUSB0`, then select the serial port in
OctoPrint's connection settings. A webcam works the same way if you want the
print monitor view.

## Your data persists

Configuration, uploaded files, timelapses and plugin data live in the
`octoprint_data` volume (`/octoprint`), so they survive redeploys.
