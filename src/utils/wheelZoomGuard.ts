type GuardableWheelEvent = Pick<WheelEvent, 'ctrlKey' | 'preventDefault'>;

export const guardCtrlWheelZoom = (event: GuardableWheelEvent) => {
    if (!event.ctrlKey) return false;
    event.preventDefault();
    return true;
};
