/**
 * The option/task image picker is now `app/[locale]/(admin)/_components/ImagePicker.tsx` — one
 * Pexels-only picker shared by every admin editing surface, including `StimulusEditor` and the
 * woordkaarten drawer, which each used to have their own. This file stays as the name its four
 * callers in `/admin/questions`, `/admin/fragmenten` and `/admin/opgaven` already import.
 */
export { default } from '../../../_components/ImagePicker';
export type { ImageTarget } from '../../../_components/ImagePicker';
