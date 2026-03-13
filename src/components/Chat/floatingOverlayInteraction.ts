export const shouldPreserveSelectableReplyMouseDown = (target: HTMLElement | null) => {
    if (!target) return false;

    if (target.closest('.message-context-menu')) return true;
    if (target.closest('.floating-subsession-btn')) return true;
    if (target.closest('.overlay-message-selectable')) return true;

    return false;
};
