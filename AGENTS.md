# Agents.md

This file contains notes for AI agents working on this project.

## Rebrickable Color IDs

- The Rebrickable API returns **color ID `0` for Black**.
- Do **not** assume that Black should be mapped to ID `1`.
- The color cache may contain `id: 0` for Black, which is correct according to the Rebrickable API.
- If you encounter issues with color ID `0`, investigate the actual API response rather than assuming it should be `1`.
