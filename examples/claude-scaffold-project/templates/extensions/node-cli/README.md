# Extension: node-cli

Node.js 20+ CLI / library scaffold.

## Includes

- `package.json` — minimal, ESM (`"type": "module"`), `node --test` for tests.
- `engine/index.js` — entry point with a `hello()` smoke function.
- `engine/index.test.js` — smoke test using `node:test` + `node:assert/strict`.

## When to attach

- New Node CLI tools.
- Local Node libraries / utilities.
- Anything where Node 20+ is the runtime and tests run via `node --test`.

## Env vars

None at scaffold time. Add to `.env.example` when first secret appears.

## Smoke check after scaffold

```bash
cd <project>
npm test
```

Expected: 1 passing test (`hello smoke`).
