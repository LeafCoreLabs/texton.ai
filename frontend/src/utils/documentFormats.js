/** Extensions Apache Tika can typically extract text from */
export const ALLOWED_EXTENSIONS = [
  'pdf',
  'doc', 'docx', 'dot', 'dotx',
  'odt', 'rtf',
  'txt', 'md', 'csv', 'tsv',
  'json', 'xml', 'html', 'htm',
  'xls', 'xlsx', 'xlsm', 'ods',
  'ppt', 'pptx', 'odp',
  'epub',
  'pages', 'numbers', 'key',
];

export const ACCEPT_ATTRIBUTE = ALLOWED_EXTENSIONS.map(ext => `.${ext}`).join(',');

export const FORMATS_LABEL =
  'PDF, Word, Excel, PowerPoint, OpenDocument, RTF, HTML, TXT, Markdown, CSV, EPUB, and more';

export function getFileExtension(filename) {
  if (!filename || !filename.includes('.')) return '';
  return filename.split('.').pop().toLowerCase();
}

export function isAllowedFile(file) {
  if (!file?.name) return false;
  const ext = getFileExtension(file.name);
  return ALLOWED_EXTENSIONS.includes(ext);
}

export function fileValidationError(file) {
  if (!file) return 'No file selected.';
  if (file.size === 0) return 'File is empty.';
  const maxMb = 50;
  if (file.size > maxMb * 1024 * 1024) return `File must be under ${maxMb} MB.`;
  if (!isAllowedFile(file)) {
    return `Unsupported format. Supported: ${FORMATS_LABEL}.`;
  }
  return null;
}
