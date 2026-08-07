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
Analyze this invoice or receipt image carefully. Be CONSERVATIVE - only fill in fields you are confident about. Leave fields as empty string or null if unsure.

Extract the expense details into a valid JSON object matching this schema:
{
  "vendor": "String - The vendor, company, or FBO name exactly as shown on the document. Always fill this in if visible.",
  "amount": null or Number - The TOTAL invoice/receipt amount as a number (e.g. 1420.50). Use null if you cannot determine the total.
  "date": "String or null - Transaction date in YYYY-MM-DD format. Use null if not clearly visible.",
  "category": "String - MUST be one of these exact values: Catering, Cleaning / Detailing, Crew Meal, Customs / Border Fees, De-icing, Fuel, GPU / Start Cart, Ground Transportation, Handling, Hangar / Storage, Hotel, Landing Fee, Lavatory Service, Maintenance / Repairs, Navigation / Overflight, Oil / Fluids, Oxygen Service, Ramp Fee, Tie-down / Parking, Wi-Fi / Data, Other. If none match well, you may suggest a new category name.",
  "payment": "String or null - ONLY use one of: Avcard, Avfuel, World Fuel, Direct Bill, Titan, Company Card, Personal Card, Other. Use null if payment method is not clearly shown.",
  "fuelType": "String or null - ONLY if this is a FUEL invoice, use one of: Avfuel, AEG, Atlantic, Everest, EVO, FBO, Phillip66, Signature, Titan, World Fuel, CAA, Other. Use null if this is not a fuel invoice or fuel supplier is not identifiable.",
  "gallons": null or Number - ONLY if this is a fuel invoice, extract the fuel quantity in gallons as a number. Use null if not a fuel invoice or quantity not shown.",
  "invoiceNumber": "String - Receipt or invoice reference number if visible, or empty string",
  "description": "String - Brief summary of line items (e.g. 250 gal Jet-A @ $5.68/gal + Ramp Fee)"
}

IMPORTANT RULES:
- For vendor: Always extract the company/business name.
- For category: Use the EXACT category names from the list above. Only create a new category if nothing in the list fits.
- For payment: ONLY use values from the list. If you cannot determine payment method, use null.
- For fuelType: ONLY fill this if the invoice is clearly for fuel. If fuel supplier matches one in the list, use it. Otherwise default to "FBO".
- For gallons: ONLY fill this if the invoice is for fuel and shows a quantity. Otherwise null.
- For amount: Must be the total/grand total. If unclear, use null.
- Leave any field null/empty if you are not confident.

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
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent',
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent',
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'
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
          lastErrorText = errBody || `Model unavailable at ${ep}`;
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
    const rawErr = response ? await response.text() : lastErrorText;
    if (rawErr.includes('API_KEY_INVALID') || rawErr.includes('API key not valid')) {
      throw new Error('Invalid Gemini API key. Please generate a new free key at aistudio.google.com.');
    }
    throw new Error(`API Key Connection Error: Please verify your key at aistudio.google.com.`);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  const cleanedJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(cleanedJson);

  return {
    vendor: parsed.vendor || '',
    amount: parsed.amount != null ? (typeof parsed.amount === 'number' ? parsed.amount : parseFloat(parsed.amount)) : '',
    date: parsed.date || '',
    category: parsed.category || '',
    payment: parsed.payment || '',
    fuelType: parsed.fuelType || '',
    gallons: parsed.gallons != null ? parsed.gallons : '',
    invoiceNumber: parsed.invoiceNumber || '',
    description: parsed.description || '',
    autoParsed: true
  };
}
