# Selection Floating Final Visual Tuning Design

**User Intent:** The selection floating pill should feel even lighter and less distracting. The border should be softer, and hover feedback should stay subtle rather than noticeably enlarging the pill.

## Approach Options

1. Adjust only the border color and hover transform in CSS.
   Recommendation because it directly addresses the visual concerns with the smallest possible change set.

2. Rework the full hover system including shadow and background transitions.
   Rejected for now because the request is specifically about border weight and scaling intensity.

## Approved Design

- Replace the current floating pill border with a lighter semi-transparent neutral border.
- Reduce the hover scale from the current stronger value to a gentler micro-scale.
- Leave order, copied feedback, sizing, and click behavior unchanged.

## Testing

- Rely on existing component tests and project verification because this is a CSS-only tuning pass.
