# seed

Seed data for both systems, plus the reset and layout scripts.

- `modules.json`: SITS ground truth. 3 valid Computer Science modules and **one deliberately broken module** (`U24CS150`: weights sum to 90, missing due date, empty learning outcomes) to test flagging.
- `pnpm seed`: write `data/sits.json` and `data/bb.json` (BB gets one empty course shell per module), layout `v1`.
- `pnpm reset`: same, but keeps each app's current layout (so `pnpm layout v2 && pnpm reset` works for the demo).
- `pnpm layout v1|v2`: switch the stored layout of both apps.

Data lives in `/data` at the repo root (gitignored).
