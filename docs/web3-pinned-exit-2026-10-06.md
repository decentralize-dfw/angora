# Web3: physical plan-exit geometry

6 October 2026 · Europe/Paris. Revision `20261006-pin-5`.

The previous wheel-release fix did not address the physical jump. Reproducing a wheel gesture over the Dimensions checkbox exposed the remaining failure: the page moved inside the sticky runway, then the incoming last plan prematurely shortened its wrapper from 1152 to 721 pixels. The stage moved to **−85.72 pixels**, lost its input owner, cancelled the transition and rebuilt the preceding plan. Continued wheel input then remained consumed.

Corrections:

- Incoming plan metadata can reserve its controls without changing the wrapper's terminal geometry. That change now happens after the transition commits.
- A completed wrapper retains the distance already travelled inside its sticky runway. For example, a 40.325-pixel offset produces a 761.325-pixel wrapper around the 720-pixel stage. Its bottom stays one pixel beyond the viewport, so the stage never pulls upward at commit.
- Wheel input over checkbox/radio controls follows the pinned scene. Text-editing fields and dialogs retain their own input behavior.
- Upward re-entry aligns to the visible end of the sticky runway instead of jumping to its beginning.
- Incoming plan nodes are excluded from scroll anchoring only while a transition is pending.

Verification focused on the visible stage, not just the page's scroll value:

- Repeated the checkbox-triggered reproduction: stage stayed at 0 during the transition; the route committed to cursor 7 without a cancellation/rebuild. Continued input then scrolled the completed scene normally.
- Tested a partially travelled runway: visible stage position was 0 before, during and after the final plan transition.
- Tested 390×844, 320×568 and 844×390 viewport emulations: stage position remained 0 throughout. Residual native keyboard movement changed the document scroll in some checks, but did not move the visible pinned frame.
- Exited downward and re-entered upward: the garden plan and camera selection were retained, with the stage back at 0.
- 24 tests passed, including offset-preserving geometry across five viewport heights and upward boundary alignment.

Raw observations: [pinned-plan-2026-10-06.json](web3-qa/pinned-plan-2026-10-06.json). These checks do not claim universal browser/device coverage or an aesthetic score.
