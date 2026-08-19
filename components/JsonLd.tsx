/**
 * One JSON-LD block.
 *
 * Every page used to inline its own `<script type="application/ld+json"
 * dangerouslySetInnerHTML={{ __html: JSON.stringify(x) }} />`. That is the same three
 * decisions repeated per page — the MIME type, the stringify, and the escaping — and the
 * escaping is the one that matters: a `</script>` sequence inside any string value (a page
 * title, an FAQ answer) closes the tag early and injects the rest as markup.
 *
 * `JSON.stringify` does not escape it, so this component does. Nothing else here is clever;
 * the point is that there is one place for it.
 */
export default function JsonLd({ data }: { data: unknown }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
