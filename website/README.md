# website

This package now builds the OpenProxy docs site with `stropress@0.0.5` from the npm registry.

## Commands

```bash
bun run dev
bun run build
bun run start
```

`dev` starts the local Stropress dev server.
`build` outputs static assets to `dist/`.
`start` serves the generated `dist/` directory.

## Structure

- `docs/config.json`: Stropress site configuration, navigation, sidebar, and locale metadata.
- `docs/`: Default locale documents.
- `docs/en/`: English locale documents.
- `docs/public/`: Static assets copied into the generated site.

## Notes

- This site uses the published `stropress` package, not the local sibling repository.
- Content stays in MDX, but the route structure now follows Stropress conventions: `/` for Chinese and `/en/` for English.
