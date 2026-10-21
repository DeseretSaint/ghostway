# Routing pointer — endpoint exemption is why a camera stays on the strict route

Status: filed by Sophia (dm-manager) 2026-10-20 21:46 while routing card t_e53492ae is mid-run.

## The finding
`src/router.js` strict hard floor:
```js
if (hardFloor && g.eCam[e] >= hardFloor && u !== startNode && v !== endNode) continue;
```
Exposed edges touching the **origin or destination node are exempt** ("first/last road of the trip").
In the live on-device screenshot `docs/bug-reports/20261020-live-top.png`, the Clearest route still shows
**"Passes 1 camera"** and a bright red camera dot sits ON the route line near the route's end
(dot ~ (714,707) vs endpoint ~ (772,660)) — consistent with the destination-side exemption letting the
final approach edge pass the camera. Keaton's Home Depot report ("red dot near the beginning") matches the
origin-side exemption. Either side, the exemption lets a high-exposure edge be used when a clear alternate
(2–3 min detour) exists.

## Fix direction (what to implement)
Do **not** blanket-exempt endpoint roads. Instead:
- Allow a high-exposure first/last edge only when there is **no legal clear alternate exit** from that
  endpoint node (i.e., every other edge from that node also exceeds the hard floor, or none exist).
- Otherwise forbid it (or apply a heavy penalty big enough that the ~2–3 min detour wins) so the strict
  route genuinely avoids the camera.
- Keep the marker rendering unchanged — never hide/remove the red dot (G-71 hard rule).

## Verification required (existing acceptance)
- On-device screenshot of strict mode: red dot present but OFF the polyline.
- "Passes" cam count for the Home Depot route should drop to 0 (or the dot is visibly off-route).
- Keep routing honest: no data edits that delete/reclassify the camera; routing logic change only.
