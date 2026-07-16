export function positiveIntegerParam(params: URLSearchParams, name: string): number | undefined {
    const value = params.get(name);
    if (!value || !/^[1-9]\d*$/.test(value)) return undefined;

    const parsed = Number(value);
    return Number.isSafeInteger(parsed) ? parsed : undefined;
}

export function nonNegativeIntegerParam(params: URLSearchParams, name: string): number | undefined {
    const value = params.get(name);
    if (value === null || !/^(0|[1-9]\d*)$/.test(value)) return undefined;

    const parsed = Number(value);
    return Number.isSafeInteger(parsed) ? parsed : undefined;
}
