# Meridian Hub Website

Marketing and documentation site for [Meridian](https://github.com/meridianhub/meridian), the BIAN-compliant open banking ledger.

**Live site**: https://www.meridianhub.org

## Local Development

### Prerequisites

- [Hugo Extended](https://gohugo.io/installation/) (v0.128.0 or later)
- Git

### Quick Start

```bash
# Clone with submodules (theme)
git clone --recurse-submodules https://github.com/meridianhub/meridianhub.github.io.git
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

```
.
├── content/          # Markdown content
│   ├── features/     # BIAN service domain pages
│   ├── architecture/ # ADR documentation
│   ├── api/          # API reference
│   ├── roadmap/      # Development roadmap
│   └── use-cases/    # Industry applications
├── layouts/          # Custom templates
├── assets/           # CSS, JS (processed by Hugo)
├── static/           # Static assets (copied as-is)
├── themes/PaperMod/  # Hugo theme (git submodule)
└── hugo.toml         # Site configuration
```

## Deployment

Automatic via GitHub Actions on push to `main`. The workflow builds the site and deploys to GitHub Pages.

## Content Generation

Feature pages, API reference, and architecture documentation are auto-generated from the [Meridian codebase](https://github.com/meridianhub/meridian) using `scripts/generate-site-content.go`.

## License

Apache License 2.0
