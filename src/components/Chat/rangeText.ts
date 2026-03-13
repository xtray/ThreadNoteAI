export type RangeLike = {
    toString: () => string;
};

export const getTrimmedRangeText = (range: RangeLike | null | undefined) => range?.toString().trim() || '';
