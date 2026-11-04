const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const dir = 'C:\\Users\\testadmin\\Downloads\\New folder';

async function main() {
  const files = fs.readdirSync(dir);
  console.log('Files in directory:', files);

  for (const f of files) {
    const fullPath = path.join(dir, f);
    const stats = fs.statSync(fullPath);
    console.log(`\n======================================================`);
    console.log(`FILE: ${f} (${stats.size} bytes)`);
    console.log(`======================================================`);

    if (f.endsWith('.pdf')) {
      try {
        const buf = fs.readFileSync(fullPath);
        let text = '';
        if (pdf.PDFParse) {
          const parser = new pdf.PDFParse({ data: buf });
          await parser.load();
          const res = await parser.getText();
          text = typeof res === 'string' ? res : res.text;
        } else {
          const res = await pdf(buf);
          text = res.text;
        }
        console.log(`Extracted text length: ${text.length}`);
        console.log(`Text preview (first 1000 chars):\n${text.slice(0, 1000)}`);
        if (text.length > 1000) {
          console.log(`\nText full dump:\n${text}`);
        }
      } catch (err) {
        console.error('PDF Parse error:', err.message);
      }
    } else if (f.endsWith('.jpeg') || f.endsWith('.jpg') || f.endsWith('.png')) {
      console.log(`Image file: ${f}`);
    }
  }
}

main().catch(console.error);
