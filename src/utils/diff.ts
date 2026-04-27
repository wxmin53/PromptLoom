import DiffMatchPatch from 'diff-match-patch'

const dmp = new DiffMatchPatch()

export interface DiffResult {
  leftHtml: string
  rightHtml: string
}

export function computeDiff(original: string, modified: string): DiffResult {
  const diffs = dmp.diff_main(original, modified)
  dmp.diff_cleanupSemantic(diffs)

  let leftHtml = ''
  let rightHtml = ''

  for (const [op, text] of diffs) {
    const escaped = escapeHtml(text)
    if (op === DiffMatchPatch.DIFF_EQUAL) {
      leftHtml += escaped
      rightHtml += escaped
    } else if (op === DiffMatchPatch.DIFF_DELETE) {
      leftHtml += `<span class="diff-delete">${escaped}</span>`
    } else if (op === DiffMatchPatch.DIFF_INSERT) {
      rightHtml += `<span class="diff-insert">${escaped}</span>`
    }
  }

  return { leftHtml, rightHtml }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>')
}
