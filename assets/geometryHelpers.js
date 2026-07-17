// Geometry Helper Functions
// Extracted from main.js to centralize normalized coordinate math for level editing and previews.
/** Narrow arbitrary input to an object whose fields can be inspected. */
function isObjectLike(value) {
    return typeof value === 'object' && value !== null;
}
/** Match `Number.isFinite` while narrowing candidate coordinates to numbers. */
function isFiniteNumber(value) {
    return typeof value === 'number' && Number.isFinite(value);
}
/**
 * Clamp a normalized coordinate to the allowed editor bounds.
 * @param value - The normalized coordinate value to clamp (0-1 expected).
 * @returns A normalized coordinate restricted to the editor safe area.
 */
export function clampNormalizedCoordinate(value) {
    if (!Number.isFinite(value)) {
        return 0.5;
    }
    return Math.min(0.98, Math.max(0.02, value));
}
/**
 * Ensure a point object contains valid normalized coordinates.
 * @param point - A potential normalized point.
 * @returns A sanitized point with safe normalized coordinates.
 */
export function sanitizeNormalizedPoint(point) {
    if (!point || !isObjectLike(point)) {
        return { x: 0.5, y: 0.5 };
    }
    const rawX = isFiniteNumber(point.x) ? point.x : 0.5;
    const rawY = isFiniteNumber(point.y) ? point.y : 0.5;
    const result = {
        x: clampNormalizedCoordinate(rawX),
        y: clampNormalizedCoordinate(rawY),
    };
    // Preserve speedMultiplier if present
    if (isFiniteNumber(point.speedMultiplier)) {
        result.speedMultiplier = point.speedMultiplier;
    }
    return result;
}
/**
 * Transform a normalized point based on screen orientation.
 * @param point - The source point in default orientation.
 * @param orientation - Current device orientation.
 * @returns The transformed point respecting orientation.
 */
export function transformPointForOrientation(point, orientation) {
    const normalized = sanitizeNormalizedPoint(point);
    if (orientation === 'landscape') {
        return {
            x: clampNormalizedCoordinate(normalized.y),
            y: clampNormalizedCoordinate(1 - normalized.x),
        };
    }
    return normalized;
}
/**
 * Transform a normalized point back to portrait orientation.
 * @param point - The point in the current orientation.
 * @param orientation - Current device orientation.
 * @returns The point normalized for portrait orientation.
 */
export function transformPointFromOrientation(point, orientation) {
    const normalized = sanitizeNormalizedPoint(point);
    if (orientation === 'landscape') {
        return {
            x: clampNormalizedCoordinate(1 - normalized.y),
            y: clampNormalizedCoordinate(normalized.x),
        };
    }
    return normalized;
}
/**
 * Compute the squared distance from a point to a line segment.
 * @param point - The point being measured.
 * @param start - Start point of the segment.
 * @param end - End point of the segment.
 * @returns The squared shortest distance between the point and segment.
 */
export function distanceSquaredToSegment(point, start, end) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lengthSquared = dx * dx + dy * dy;
    if (lengthSquared === 0) {
        const diffX = point.x - start.x;
        const diffY = point.y - start.y;
        return diffX * diffX + diffY * diffY;
    }
    let t = ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared;
    t = Math.max(0, Math.min(1, t));
    const projX = start.x + t * dx;
    const projY = start.y + t * dy;
    const diffX = point.x - projX;
    const diffY = point.y - projY;
    return diffX * diffX + diffY * diffY;
}
