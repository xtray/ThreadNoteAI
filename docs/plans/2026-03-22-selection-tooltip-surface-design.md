# Selection Tooltip Surface Design

**User Intent:** The selection tooltip should feel modern and clean, match the current app theme, and avoid the heavy dark bubble plus diamond connector that currently feels visually out of place.

## Approach Options

1. Use a soft surface tooltip with theme-aware background, subtle border, rounded corners, and no pointer.
   Recommendation because it keeps the tooltip legible while integrating naturally with both light and dark themes.

2. Keep the dark tooltip but remove the diamond and reduce shadow weight.
   Rejected because it would still feel disconnected from the surrounding floating pill and app chrome.

3. Replace the tooltip with a bare text label rendered directly above the pill.
   Rejected because it risks blending into message content and losing clear affordance on busy backgrounds.

## Approved Design

- Use a compact rounded tooltip surface instead of the current dark bubble aesthetic.
- Make the tooltip background and border theme-aware so it feels like part of the app rather than an overlay from another visual system.
- Remove the diamond connector entirely.
- Keep the existing hover/focus behavior and positioning model so only the visual styling changes.

## Testing

- Add a focused regression assertion that the tooltip no longer renders the connector pseudo-element hook in markup-sensitive tests where possible.
- Run the targeted selection action tests plus build verification after the CSS update.
