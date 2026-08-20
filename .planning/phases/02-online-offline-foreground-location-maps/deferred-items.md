# Deferred Items

Out-of-scope findings logged during plan execution, not fixed inline per the executor's scope
boundary rule (only issues directly caused by the current task's changes are auto-fixed).

## From 02-08 (D04 Verification hub retrofit)

- `src/app/(app)/verify/[documentType].tsx` still uses a stale Tailwind default
  (`text-lg font-semibold text-neutral-900`) that the 02-08 verification-suite grep
  (`font-(medium|semibold|bold)|rounded-(md|lg|full)`) flags. This file is explicitly out of
  scope for plan 02-08 ("Do NOT change ... verify/[documentType].tsx — this task is the hub
  screen only"). A future plan retrofitting D04's document-capture sub-screen should pick this up.
