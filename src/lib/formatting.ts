/** Normalize display titles without mutating the submitted or stored text. */
export function formatTitleCase(value: string): string {
  return value.replace(/[\p{L}\p{M}\p{N}'\u2019]+/gu, word => {
    if (/^[A-Z0-9]{2,4}$/u.test(word)) return word

    return word
      .toLowerCase()
      .replace(/^([\p{L}\p{N}])/u, first => first.toUpperCase())
  })
}
