# @studiometa/ui — API

Small Symfony application powering [ui.studiometa.dev](https://ui.studiometa.dev):

- renders `@ui/` Twig templates for the playground iframe (`/`);
- exposes an **MCP server** so agents can discover Reference items and generate playgrounds.

## MCP server

The server is built with [`symfony/mcp-bundle`](https://github.com/symfony/mcp-bundle) and served over the Streamable HTTP transport. The app is mounted under `/api` on the documentation host, so the endpoint is:

```
POST https://ui.studiometa.dev/api/mcp
```

### Tools

| Tool                          | Description                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------------ |
| `list_concepts`               | List the architectural concepts and their canonical documentation paths.                   |
| `get_concept`                 | Get documentation about packages, runtime behavior, composition or customization.          |
| `list_reference_items`        | List every documented component, primitive, decorator and helper with its available pages. |
| `get_reference_item`          | Get an item's Twig/JavaScript API or its canonical usage documentation.                    |
| `get_reference_item_examples` | Get an item's examples or fall back to its canonical usage documentation.                  |
| `list_components`             | Backwards-compatible alias for `list_reference_items`.                                     |
| `get_component_api`           | Backwards-compatible alias for `get_reference_item`.                                       |
| `get_component_example`       | Backwards-compatible alias for `get_reference_item_examples`.                              |
| `build_playground_url`        | Turn Twig/HTML, JavaScript and CSS into a shareable, live playground URL.                  |
| `parse_playground_url`        | Decode a shared playground URL back into its Twig/HTML, JavaScript, CSS and theme.         |

The discovery tools read the built VitePress documentation (`llms.txt` and the per-page Markdown files), so they stay in sync with the docs on every build. `build_playground_url` encodes the whole playground state in the URL hash — the code fields are zlib-compressed then base64-encoded, mirroring the front-end `zip()` helper from `@studiometa/playground` — so nothing is stored server-side.

### Configuration

See `config/packages/mcp.yaml`. Two paths can be overridden with environment variables:

- `DOCS_DIST_DIR` — location of the built docs (defaults to the docs `dist` directory, which the deployed site symlinks next to this app);
- `PLAYGROUND_BASE_URL` — base URL of the playground the generated links point to.

### Connecting an agent

Point any MCP client at the HTTP endpoint, e.g. with Claude Code:

```sh
claude mcp add --transport http studiometa-ui https://ui.studiometa.dev/api/mcp
```
