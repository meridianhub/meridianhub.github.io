# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Hugo static site deployed to GitHub Pages at www.meridianhub.org. The site uses Hugo Extended 0.128.0 with Dart Sass support and the PaperMod theme.

## Build Commands

```bash
# Local development server with live reload
hugo server -D

# Production build (minified)
hugo --minify

# Build with specific base URL
hugo --minify --baseURL "https://meridianhub.github.io/"
```

## Repository Structure

- Source code lives in `meridianhub.github.io-main/`
- Worktrees should be created under `worktree/<branch-name>/`
- Task Master configuration is at the repo root (`.taskmaster/`)

## Deployment

Deployment is automatic via GitHub Actions on push to `main` branch. The workflow:
1. Installs Hugo Extended 0.128.0 and Dart Sass
2. Builds the site with `hugo --minify`
3. Deploys the `public/` directory to GitHub Pages

## Hugo Content Structure

When adding content, follow Hugo conventions:
- `content/` - Markdown content files
- `layouts/` - HTML templates
- `static/` - Static assets (images, CSS, JS)
- `themes/` - Hugo themes (use git submodules)
- `config.toml` or `hugo.toml` - Site configuration
