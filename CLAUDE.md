# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**sarahs-spil** (Sarah's Games) is a browser-based game collection hosted on GitHub Pages at sarah.joensen.eu. The main game is "Blomsterhaven" (Flower Garden), a Danish-language flower-growing simulation.

## Tech Stack

- Vanilla JavaScript with jQuery 3.7.1
- HTML5 + CSS3 (animations, flexbox, SVG cursors)
- GitHub Pages for hosting (custom domain via CNAME)
- No build system - static files served directly

## Development

No build, test, or lint commands. Edit files directly and push to GitHub for automatic deployment.

**To test locally:** Open index.html in a browser or use a local server.

## Architecture

### Launcher (root)
- `index.html` - Game hub displaying cards linking to individual games
- `style.css` - Pink-themed responsive card grid

### Blomsterhaven Game (`/Blomsterhaven`)
- `index.html` - Game UI with sky, garden plots, and control panel
- `script.js` - All game logic using jQuery
- `style.css` - Visuals including SVG-based flower stages and animations

**Game State Model (script.js):**
- `money` - Player currency (KR)
- `flowerData[]` - Array of plot objects with: `id`, `isOccupied`, `flowerType`, `growthStage`, `waterLevel`, `waterNeeded`
- Configuration constants at top of file: costs, values, cooldowns

**Core Mechanics:**
- Plant seeds → Water to advance growth stages → Harvest for money
- Special actions (sun/music) accelerate all flowers with cooldowns
- Buy additional plots (max 10)

## Adding New Games

1. Create folder in root (e.g., `/NewGame`)
2. Add index.html, script.js, style.css
3. Add screenshot.png for launcher preview
4. Add game card to root index.html

## Adding New Flowers

1. Add growth stage SVG classes in style.css
2. Define stages in `growthStages` object in script.js
3. Add cost to `seedCosts` and value to `flowerValues`
4. Add seed button to HTML

## Localization

UI is in Danish:
- Frø (Seeds), Værktøj (Tools), Vand (Water), Høst (Harvest)
- Marguerit (Daisy), Tulipan (Tulip)
- Køb Jord (Buy Plot), KR (currency)
