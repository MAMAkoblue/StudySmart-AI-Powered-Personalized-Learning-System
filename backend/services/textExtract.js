import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export async function extractText(buffer, mimetype, filename) {
  const name = (filename || '').toLowerCase();
  if (mimetype === 'application/pdf' || name.endsWith('.pdf')) {
    const data = await pdfParse(buffer);
    return data.text || '';
  }
  if (name.endsWith('.docx') || mimetype.includes('wordprocessingml')) {
    const r = await mammoth.extractRawText({ buffer });
    return r.value || '';
  }
  // txt / md / fallback
  return buffer.toString('utf8');
}
