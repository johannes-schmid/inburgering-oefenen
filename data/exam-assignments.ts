/**
 * Legacy KNM static exam→question map. Exams are now a real table (`exams`) and
 * questions carry `exam_id`, so this stays empty and the admin drift check is a no-op.
 */
export const EXAM_ASSIGNMENTS: Record<number, number[]> = {};
