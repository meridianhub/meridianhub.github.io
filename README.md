# Meridian Hub Website

Marketing site for [Meridian](https://github.com/meridianhub/meridian), the source-available transaction integrity engine.

**Live site**: [www.meridianhub.org](https://www.meridianhub.org)

## Local Development

### Prerequisites

- [Hugo Extended](https://gohugo.io/installation/) (v0.128.0 or later)
- Git

### Quick Start

```bash
git clone https://github.com/meridianhub/meridianhub.github.io.git
cd meridianhub.github.io

# Start local server with drafts
hugo server -D

# View at http://localhost:1313
```

### Build

```bash
# Production build
hugo --minify

# Output is in public/
```

### Install Hugo (macOS)

```bash
brew install hugo
```

## Project Structure

```text
.
├── content/          # Page front matter (layouts carry the content)
│   ├── energy/       # Energy retail vertical page
│   └── cookbook/     # Economy cookbook gallery
├── layouts/          # Custom theme (no external theme dependency)
│   ├── index.html    # Homepage
│   ├── energy/       # Energy page template
│   ├── cookbook/     # Cookbook gallery template
│   └── partials/     # Head, header, footer, pattern cards
├── assets/           # CSS, JS (processed by Hugo pipes)
├── data/cookbook.json # Pattern registry snapshot (see scripts/)
├── scripts/          # sync-cookbook.py regenerates data/cookbook.json
├── static/           # Static assets (copied as-is)
└── hugo.toml         # Site configuration
```

## Cookbook Data

The cookbook gallery is generated at build time from `data/cookbook.json`, a snapshot
of the pattern metadata in the [Meridian repo](https://github.com/meridianhub/meridian).
Refresh it after cookbook changes:

```bash
scripts/sync-cookbook.py /path/to/meridian-checkout
```

## Deployment

Automatic via GitHub Actions on push to `main`. The workflow builds the site and deploys to GitHub Pages.

## License

Business Source License 1.1 - See [LICENSE](LICENSE) file for details.

Same licensing as the [Meridian](https://github.com/meridianhub/meridian) project. Converts to Apache 2.0 on January 14, 2030.
