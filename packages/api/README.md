# @studiometa/ui — API

Small Symfony application powering [ui.studiometa.dev](https://ui.studiometa.dev):

- renders `@ui/` Twig templates for the playground iframe (`/`, `/source`);
- exposes an **MCP server** so agents can discover components and generate playgrounds.

## MCP server

The server is built with [`symfony/mcp-bundle`](https://github.com/symfony/mcp-bundle)
and served over the Streamable HTTP transport. The route is `POST /mcp` on this
application's own host — i.e. the `api.` subdomain used for the render endpoint
(see `config/packages/nelmio_cors.yaml`):

```
POST https://api.ui.studiometa.dev/mcp
```

> **Deployment note:** the endpoint requires the Symfony app to be served as its
> own document root (the `api.` vhost). Mounting the app under a sub-path of the
> static docs host (the `/api/` symlink) only exposes the `/` render route, not
> sub-routes such as `/mcp` or `/source`, because that vhost's `try_files`
> falls back to the static docroot rather than the Symfony front controller.

### Tools

| Tool | Description |
| --- | --- |
| `list_components` | List every `@studiometa/ui` component and the doc pages available for each. |
| `get_component_api` | Twig parameters/blocks (and JS options/refs/events) of a component. |
| `get_component_example` | Ready-to-use Twig and JS snippets for a component. |
| `build_playground_url` | Turn Twig/HTML, JavaScript and CSS into a shareable, live playground URL. |

The discovery tools read the built VitePress documentation (`llms.txt` and the
per-page Markdown files), so they stay in sync with the docs on every build.
`build_playground_url` encodes the whole playground state in the URL hash — the
code fields are zlib-compressed then base64-encoded, mirroring the front-end
`zip()` helper from `@studiometa/playground` — so nothing is stored server-side.

### Configuration

See `config/packages/mcp.yaml`. Two paths can be overridden with environment
variables:

- `DOCS_DIST_DIR` — location of the built docs (defaults to the docs `dist`
  directory, which the deployed site symlinks next to this app);
- `PLAYGROUND_BASE_URL` — base URL of the playground the generated links point to.

### Connecting an agent

Point any MCP client at the HTTP endpoint, e.g. with Claude Code:

```sh
claude mcp add --transport http studiometa-ui https://api.ui.studiometa.dev/mcp
```
