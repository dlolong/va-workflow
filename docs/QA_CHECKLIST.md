# Manual pilot acceptance checklist

Record actual observed results, not assumptions from reading source. Use disposable staging accounts and generic fixtures.

| Flow | Expected result | Status |
|---|---|---|
| New project migrations | All four apply in order without error | Not run at delivery |
| Build/type/lint | Genuine dependency installation, zero build/type errors, lint resolved | Not run at delivery |
| Account lifecycle | Signup, configured email confirmation, login, sign-out, password recovery | Not run at delivery |
| Workspace isolation | Another client/removed user cannot read rows, call commands or obtain file links | Not run at delivery |
| Invitations | Correct verified email only; expiry/revoke/offboarded inviter enforced | Not run at delivery |
| SOP draft and publish | VA drafts; owner/manager publishes; old runs retain version | Not run at delivery |
| Quick task | Owner creates, VA executes, saved work survives reload | Not run at delivery |
| Required typed fields | 0 and false are valid where appropriate; whitespace/N/A rules enforced | Native rules tested; live SQL/browser not run |
| Proof | Real upload, failed upload/retry, required before+after, forbidden access | Not run at delivery |
| Pre-action gate | Forbidden step remains blocked until separate approval | Not run at delivery |
| Final review | Submit → changes → correct → resubmit → accept | Not run at delivery |
| Exceptions | Deadline retained while waiting; next owner/follow-up visible | Native overdue rule tested; live flow not run |
| Reassignment/offboarding | No ownerless work or self-review; old access revoked | Not run at delivery |
| Recurrence | Weekdays/month-end/DST/catch-up; no duplicated occurrence under concurrency | Not run at delivery |
| Notifications | In-app events; configured worker reminders; real delivery when configured | Not run at delivery |
| Reporting/export | Whole-workspace counts; honest caps; safe CSV | Native CSV rules tested; live export not run |
| Mobile/accessibility | Keyboard/focus, labels, dialogs, no unintended horizontal page scroll | Not run at delivery |
| Unsaved work | Reload/back/forward/dropdowns/sign-out/network loss tested | Not run at delivery |
| Recovery | Isolated database AND object-byte restore rehearsal | Not run at delivery |

The SQL harness covers many of these rules but does not test the browser or a real Storage API transfer. The Playwright smoke suite is a starting point, not a comprehensive substitute for this matrix.
