import * as pdfjsLib from 'pdfjs-dist';

// Set up worker for PDF.js using standard cdnjs worker fallback
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/pdf.worker.min.js`;

/**
 * Convert a File object (.pdf, .jpg, .png, .jpeg) into Base64 string and mime type
 */
export async function fileToBase64Image(file) {
  if (!file) throw new Error("No file selected.");

  // Direct image handling
  if (file.type && file.type.startsWith('image/')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        const base64 = result.split(',')[1];
        resolve({ base64, mimeType: file.type });
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  // PDF handling using Canvas rendering via pdfjs-dist
  if ((file.type && file.type === 'application/pdf') || (file.name && file.name.toLowerCase().endsWith('.pdf'))) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const page = await pdf.getPage(1); // Render first page of invoice

      const viewport = page.getViewport({ scale: 2.0 }); // High res for OCR
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({ canvasContext: context, viewport }).promise;
      const dataUrl = canvas.toDataURL('image/png');
      const base64 = dataUrl.split(',')[1];
      return { base64, mimeType: 'image/png' };
    } catch (pdfErr) {
      console.warn("PDF.js render failed, trying FileReader text fallback", pdfErr);
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result;
          const base64 = result.split(',')[1];
          resolve({ base64, mimeType: 'application/pdf' });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
  }

  throw new Error("Unsupported file format. Please upload a PDF, PNG, JPG, or JPEG.");
}

/**
 * Parses an invoice/receipt file using Google Gemini Vision API and returns structured JSON
 */
export async function parseInvoiceFile(file, customApiKey = null) {
  const apiKey = customApiKey || import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('gemini_api_key');
  
  if (!apiKey) {
    throw new Error("Gemini API key is required. Please set VITE_GEMINI_API_KEY in your environment or enter it in Settings.");
  }

  const { base64, mimeType } = await fileToBase64Image(file);

  const promptText = `
Analyze this invoice or receipt image carefully.
Extract the expense details into a valid JSON object matching this schema:
{
  "vendor": "String - Vendor or FBO company name (e.g. Signature Flight Support, Atlantic Aviation, Shell Fuel, Marriott, Hertz, Maintenance Shop)",
  "amount": Number - Total invoice/receipt amount as a number (e.g. 1420.50),
  "date": "String - Transaction date in YYYY-MM-DD format",
  "category": "String - Best matching category from: Fuel, Landing Fees, Catering, Hangar/Parking, Hotel/Lodging, Maintenance, Ground Transport, Other",
  "invoiceNumber": "String - Receipt or invoice reference number if visible, or empty string",
  "description": "String - Brief summary of line items (e.g. 250 gal Jet-A Fuel @ $5.68/gal + Ramp Fee)"
}
Return ONLY raw JSON, with no markdown formatting.
`;

  const requestBody = {
    contents: [{
      parts: [
        { text: promptText },
        {
          inline_data: {
            mime_type: mimeType,
            data: base64
          }
        }
      ]
    }],
    generationConfig: {
      response_mime_type: "application/json",
      temperature: 0.1
    }
  };

  const candidateEndpoints = [
    'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent',
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent',
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent'
  ];

  let response = null;
  let lastErrorText = '';

  for (const ep of candidateEndpoints) {
    try {
      const res = await fetch(`${ep}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      if (res.status === 404 || res.status === 429) {
        const errBody = await res.clone().text().catch(() => '');
        if (res.status === 404 || errBody.includes('limit: 0')) {
          lastErrorText = `(${res.status}) on ${ep}: ${errBody}`;
          continue;
        }
      }
      response = res;
      break;
    } catch(fetchErr) {
      lastErrorText = fetchErr.message;
    }
  }

  if (!response || !response.ok) {
    const errText = response ? await response.text() : lastErrorText;
    throw new Error(`AI Invoice Parsing error (${response ? response.status : 404}): ${errText}`);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  const cleanedJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(cleanedJson);

  return {
    vendor: parsed.vendor || 'Unknown Vendor',
    amount: typeof parsed.amount === 'number' ? parsed.amount : parseFloat(parsed.amount || 0),
    date: parsed.date || new Date().toISOString().split('T')[0],
    category: parsed.category || 'Other',
    invoiceNumber: parsed.invoiceNumber || '',
    description: parsed.description || '',
    autoParsed: true
  };
}
