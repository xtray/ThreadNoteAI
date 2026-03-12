# Selection Floating Lightweight Visual Design

**User Intent:** The selection floating pill should feel lighter and less bulky, closer to the reference image. The change should only affect visual weight, not layout behavior or action flow.

## Approach Options

1. Tune only the pill and button shadow/radius values in CSS.
   Recommendation because it delivers the lighter look with the smallest possible risk.

2. Rework the full surface styling including border color and spacing.
   Rejected for now because the current request is specifically about shadow and roundness.

## Approved Design

- Reduce the outer pill shadow blur/spread so the bubble feels less elevated.
- Slightly reduce the pill border radius and the inner button radius so the shape reads as slimmer, not puffed.
- Leave action order, timing, copied state, and sizing unchanged.

## Testing

- Rely on existing test and build coverage because this is a CSS-only visual adjustment.
