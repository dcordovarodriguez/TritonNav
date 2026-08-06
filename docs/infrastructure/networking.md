# Networking

TritonNav hides Valhalla behind the server-side environment variable:

```env
VALHALLA_BASE_URL=
```

The browser never connects to Valhalla directly. The browser calls the Next.js app, and the app server calls Valhalla.

## Local Mac

Future Docker Desktop default:

```env
VALHALLA_BASE_URL=http://localhost:8002
```

## VM Hosting

For Azure Student VM, UCSD Research Cloud, or SDSC VM, point the app server at the VM-hosted route service:

```env
VALHALLA_BASE_URL=http://vm-host-or-private-ip:8002
```

Prefer private network access between the Next.js server and Valhalla. If public access is required, add firewall restrictions and monitoring before production traffic.

## Portability Boundary

Moving Valhalla from local Docker to a VM should not require frontend changes, MapLibre changes, or routing adapter rewrites.
