# ClientOS

ClientOS is a React and TypeScript CRM portfolio demo. Choose Atlas Partners, Studio North, or Meridian Capital from the workspace menu. Each workspace has its own seeded records and brand palette. Light and dark appearance work independently of the brand.

## Run locally

Use Node.js 22.12+.

```sh
npm ci
npm run dev
npm run build
```

## Try the demo

1. Add a company and create a contact linked to it.
2. Create a deal, then edit it or move it between pipeline stages by dragging the card or using its stage menu.
3. Add a task and complete it from Tasks or the dashboard. The dashboard updates from the workspace records.
4. Switch workspaces and reload to see the separate records and saved appearance.

Edits and preferences are saved in browser storage. This foundation simulates tenant separation for a demo and has no sign-in, server-side access controls, or cross-device sync.

`src/tokens.css` contains palette primitives, shared spacing and radius scales, semantic theme roles, and component aliases. Workspace palettes and appearance are set independently with `data-brand` and `data-theme`.
