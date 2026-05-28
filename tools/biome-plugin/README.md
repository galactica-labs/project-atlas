# @atlas/biome-plugin

A custom Nx plugin that integrates [Biome](https://biomejs.dev/) linting and formatting into your Nx monorepo.

## What It Does

This plugin automatically creates three targets for every project in your workspace:

- **`lint`** - Runs Biome lint on the project
- **`format`** - Runs Biome format with `--write` on the project  
- **`biome:check`** - Runs both lint and format check together

## Features

✅ **Automatic target inference** - No manual configuration needed per project  
✅ **Proper Nx caching** - Only re-lints changed files  
✅ **Uses Bun** - Runs Biome through the workspace Bun toolchain for consistency  
✅ **Project-scoped** - Each command only runs on the specific project directory  

## Usage

Once configured in `nx.json`, the plugin automatically adds targets to all projects:

```bash
# Lint a single project
bun nx run @atlas/frontend:biome:lint

# Format a single project
bun nx run @atlas/backend:biome:format

# Check (lint + format) a single project
bun nx run @atlas/ui:biome:check

# Run on all projects
bun nx run-many -t biome:lint
bun nx run-many -t biome:format
bun nx run-many -t biome:check

# Run on affected projects only
bun nx affected -t biome:lint
```

## Configuration

Add to your `nx.json`:

```json
{
  "plugins": [
    {
      "plugin": "@atlas/biome-plugin",
      "options": {
        "lintTargetName": "lint",
        "checkTargetName": "biome:check",
        "formatTargetName": "format"
      }
    }
  ]
}
```

## Plugin Options

| Option | Default | Description |
|--------|---------|-------------|
| `lintTargetName` | `"lint"` | Name of the lint target |
| `checkTargetName` | `"biome:check"` | Name of the check target (lint + format) |
| `formatTargetName` | `"format"` | Name of the format target |

## How It Works

The plugin uses Nx's inferred tasks API to:

1. Scan for all `package.json` files in the workspace
2. Create the configured targets for each project
3. Set up proper caching with inputs/outputs
4. Use `{projectRoot}` token to scope commands to each project directory

This follows the [official Nx guide for Biome integration](https://nx.dev/blog/integrate-biome-in-20-minutes).

## Related

- [Biome Documentation](https://biomejs.dev/)
- [Nx Inferred Tasks](https://nx.dev/docs/concepts/inferred-tasks)
- [Root biome.json](../../biome.json) - Workspace-wide Biome configuration
