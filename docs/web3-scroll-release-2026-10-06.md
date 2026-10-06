# Web3 wheel exit and hero overlay fix

6 October 2026, 14:08 UTC. Revision: `20261006-scroll-4`.

The previous validation missed two bugs. It inspected the garden photograph's overlay instead of the hero's “Life opens outside” overlay, and paused between wheel gestures instead of testing uninterrupted input.

## Reproduced failure

110 native wheel events, approximately 25–30 ms apart, started at the entrance plan. The final garden-plan transition completed, but every subsequent wheel event was still prevented because the gesture's `consumed` flag remained true. The page stayed at `8939.20` pixels even after the committed cursor became 7.

## Correction

- A completed reading endpoint releases the current wheel event before the gesture-tail guard runs. A pending transition still stays pinned. This also applies to upward exit from the first level and to leaving the completed hero retreat.
- The hero gradient now changes through a separate `data-shade-exit` flag at the start of the 1.3-second retreat. It no longer disappears at commit. Its opacity and the stage's background/text colour transition together; reverse scroll restores the overlay. Caption-layout state remains separate.
- The header has no background, border or bar. Text switches between the existing light/dark palette according to the surface underneath it.
- Hero videos, endpoint images and crossfade layers use one matching cover rule on desktop, eliminating the exposed green margins. Cover crops the edges as viewport proportions require. Mobile keeps a fixed 16:9 media window so the building remains visible and the video/still framing agrees.
- The separate garden-photo shade also uses a longer 650 ms fade.

## Observed verification

- Repeated the same 110-event desktop stream: the page stayed fixed while the last plan played, then continued to `9684.00` pixels without a quiet interval or another gesture. Upward exit and 390×844 viewport checks also released uninterrupted input after completion.
- Hero overlay forward: opacity `1 → 0.388 → 0`; reverse: `0 → 0.664 → 1`. The viewport and page position stayed fixed during the retreat in this check.
- At 1440×720, the hero image and stage bounds matched. Header background was transparent and border width was zero. Mobile media bounds retained a 16:9 ratio.
- 22 tests passed, including new continuous-wheel regression checks in both directions. Browser checks use responsive viewport emulation, not physical-device testing.

Raw observations: [scroll-release-2026-10-06.json](web3-qa/scroll-release-2026-10-06.json).
