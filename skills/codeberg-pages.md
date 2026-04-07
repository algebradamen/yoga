# Codeberg Pages with Custom Domain

## How it works

- Project pages are served at `https://<user>.codeberg.page/<repo>/`
- Custom domains map to the repo via a `.domains` file on the `pages` branch
- Codeberg provisions a Let's Encrypt cert automatically once DNS and `.domains` are in place

## Setup steps

### 1. Create a `pages` branch with your content

```
git checkout -b pages
git push origin pages
```

The `pages` branch is what Codeberg serves. Your `index.html` must be at the root of this branch.

### 2. Add a `.domains` file

Create `.domains` in the root of the `pages` branch. List only **external custom domains** — one per line. The first domain is the primary; all others redirect to it.

```
yoga.algebradamen.no
```

**Pitfall:** Do NOT list `*.codeberg.page` subdomains here. They are handled automatically and adding them breaks SSL provisioning.

### 3. Configure DNS

For a project site (`<repo>.<user>.codeberg.page`), set a CNAME pointing to the **project subdomain**, not the user root:

| Type  | Name   | Value                          |
|-------|--------|--------------------------------|
| CNAME | `yoga` | `yoga.narve.codeberg.page`     |

**Pitfall:** Setting CNAME to `narve.codeberg.page` (the user root) instead of `yoga.narve.codeberg.page` (the project subdomain) prevents Codeberg from matching the custom domain to the correct repo. The cert will not be provisioned.

### 4. Wait for SSL provisioning

Once DNS propagates and Codeberg detects the `.domains` file, it automatically issues a Let's Encrypt cert. This typically takes a few minutes.

## Verification commands

**Check DNS:**
```
dig yoga.algebradamen.no CNAME +short
dig yoga.algebradamen.no +short
```

**Check if port 443 is open and TLS handshake succeeds:**
```
curl -v https://yoga.algebradamen.no 2>&1 | head -40
```

**Inspect the certificate:**
```
echo | openssl s_client -connect yoga.algebradamen.no:443 -servername yoga.algebradamen.no 2>/dev/null | openssl x509 -noout -issuer -dates
```
Expected output: `issuer=...Let's Encrypt...` with valid dates.

**Quick live check:**
```
curl -s -o /dev/null -w "%{http_code}" https://yoga.algebradamen.no
```

## URLs

| Purpose                | URL                                    |
|------------------------|----------------------------------------|
| Project page (default) | `https://narve.codeberg.page/yoga/`    |
| Custom domain          | `https://yoga.algebradamen.no`         |
| Repo settings          | `https://codeberg.org/narve/yoga/settings` |
| Codeberg Pages docs    | `https://docs.codeberg.org/codeberg-pages/` |
| Custom domain docs     | `https://docs.codeberg.org/codeberg-pages/using-custom-domain/` |
| Troubleshooting        | `https://docs.codeberg.org/codeberg-pages/troubleshooting/` |

## Common pitfalls

- **CNAME points to user root instead of project subdomain** — Codeberg can't match the domain to the repo; cert never provisioned.
- **`*.codeberg.page` URL in `.domains`** — Causes SSL errors; only put external domains there.
- **`yoga.narve.codeberg.page` has no valid cert** — This is expected. It's a sub-sub-domain (`*.codeberg.page` wildcard only covers one level). Use the path-based URL `narve.codeberg.page/yoga/` directly, or use a custom domain.
- **Connection refused ≠ DNS problem** — `ECONNREFUSED` on port 443 means Codeberg hasn't provisioned the cert yet, not that DNS is wrong. Check DNS separately with `dig`.
