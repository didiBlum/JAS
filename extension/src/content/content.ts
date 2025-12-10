import { FormField } from '../types';

let detectedFields: FormField[] = [];
let pageContext: {
  companyName?: string;
  jobTitle?: string;
  jobDescription?: string;
  companyValues?: string;
} = {};

/**
 * Extract company and job context from the page.
 * Looks for common patterns in job posting sites.
 */
function extractPageContext() {
  const context: typeof pageContext = {};

  // Extract company name - look for common selectors
  const companySelectors = [
    '[class*="company"]',
    '[class*="employer"]',
    '[data-qa="company"]',
    'meta[property="og:site_name"]',
    '[itemprop="hiringOrganization"]',
    'h1', // Often the company name is in the main heading
  ];

  for (const selector of companySelectors) {
    const element = document.querySelector(selector);
    if (element) {
      const text = element.getAttribute('content') || element.textContent?.trim();
      if (text && text.length > 2 && text.length < 100) {
        context.companyName = text;
        break;
      }
    }
  }

  // Extract job title
  const titleSelectors = [
    '[class*="job-title"]',
    '[class*="jobTitle"]',
    '[class*="position"]',
    '[data-qa="job-title"]',
    'meta[property="og:title"]',
    'h1',
    'h2',
  ];

  for (const selector of titleSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      const text = element.getAttribute('content') || element.textContent?.trim();
      if (text && text.length > 5 && text.length < 150 && text !== context.companyName) {
        context.jobTitle = text;
        break;
      }
    }
  }

  // Extract job description
  const descriptionSelectors = [
    '[class*="description"]',
    '[class*="job-description"]',
    '[class*="jobDescription"]',
    '[data-qa="job-description"]',
    'meta[name="description"]',
    '[itemprop="description"]',
  ];

  for (const selector of descriptionSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      const text = element.getAttribute('content') || element.textContent?.trim();
      if (text && text.length > 100) {
        // Truncate to first 1500 chars to keep it manageable
        context.jobDescription = text.substring(0, 1500);
        break;
      }
    }
  }

  // Extract company values/culture - look for keywords
  const valueKeywords = ['values', 'culture', 'mission', 'vision', 'about us', 'who we are'];
  const allText = document.body.textContent || '';

  for (const keyword of valueKeywords) {
    const regex = new RegExp(`${keyword}[:\\s]+(.*?)(?:\\n\\n|\\.|$)`, 'i');
    const match = allText.match(regex);
    if (match && match[1] && match[1].length > 20) {
      context.companyValues = match[1].substring(0, 500);
      break;
    }
  }

  return context;
}

/**
 * Extract question text from a form field.
 * Looks at labels, placeholders, aria-labels, and surrounding text.
 */
function extractQuestion(element: HTMLInputElement | HTMLTextAreaElement): string {
  // Try aria-label
  if (element.ariaLabel) {
    return element.ariaLabel;
  }

  // Try associated label
  if (element.id) {
    const label = document.querySelector(`label[for="${element.id}"]`);
    if (label?.textContent) {
      return label.textContent.trim();
    }
  }

  // Try parent label
  const parentLabel = element.closest('label');
  if (parentLabel?.textContent) {
    return parentLabel.textContent.trim();
  }

  // Try placeholder
  if (element.placeholder) {
    return element.placeholder;
  }

  // Try name attribute
  if (element.name) {
    return element.name.replace(/[-_]/g, ' ');
  }

  // Try looking at previous sibling text nodes
  let prev = element.previousSibling;
  while (prev) {
    if (prev.nodeType === Node.TEXT_NODE && prev.textContent?.trim()) {
      return prev.textContent.trim();
    }
    if (prev.nodeType === Node.ELEMENT_NODE) {
      const text = (prev as Element).textContent?.trim();
      if (text && text.length < 200) {
        return text;
      }
    }
    prev = prev.previousSibling;
  }

  return 'Unknown field';
}

/**
 * Check if an input field is likely part of a job application form.
 */
function isRelevantField(element: HTMLInputElement | HTMLTextAreaElement): boolean {
  // Skip hidden fields
  if (element.type === 'hidden' || element.offsetParent === null) {
    return false;
  }

  // Skip common non-application fields
  const skipTypes = ['password', 'email', 'tel', 'number', 'date', 'checkbox', 'radio', 'file', 'submit'];
  if (element instanceof HTMLInputElement && skipTypes.includes(element.type)) {
    return false;
  }

  // Skip very short inputs (likely name, email, phone)
  if (element instanceof HTMLInputElement && (!element.maxLength || element.maxLength < 50)) {
    return false;
  }

  return true;
}

/**
 * Scan the page for form fields that we can autofill.
 */
function scanFormFields(): FormField[] {
  const fields: FormField[] = [];

  // Extract page context (company, job info)
  pageContext = extractPageContext();
  console.log('Extracted page context:', pageContext);

  // Find all text inputs and textareas
  const inputs = document.querySelectorAll<HTMLInputElement>('input[type="text"], input:not([type])');
  const textareas = document.querySelectorAll<HTMLTextAreaElement>('textarea');

  const allFields = [...Array.from(inputs), ...Array.from(textareas)];

  allFields.forEach((element, index) => {
    if (!isRelevantField(element)) {
      return;
    }

    const question = extractQuestion(element);
    const fieldId = `field-${index}-${Date.now()}`;

    fields.push({
      id: fieldId,
      element,
      question,
      type: element.tagName.toLowerCase() === 'textarea' ? 'textarea' : 'text',
    });

    // Mark element with our ID for later retrieval
    element.setAttribute('data-submitme-id', fieldId);
  });

  return fields;
}

/**
 * Fill a specific field with an answer.
 */
function fillField(fieldId: string, answer: string): boolean {
  const element = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
    `[data-submitme-id="${fieldId}"]`
  );

  if (!element) {
    return false;
  }

  // Set the value
  element.value = answer;

  // Trigger events to ensure the form recognizes the change
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
  element.dispatchEvent(new Event('blur', { bubbles: true }));

  return true;
}

/**
 * Listen for messages from the side panel.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SCAN_FIELDS') {
    detectedFields = scanFormFields();
    sendResponse({
      success: true,
      fields: detectedFields.map(f => ({
        id: f.id,
        question: f.question,
        type: f.type,
      })),
      pageContext, // Include extracted page context
    });
    return true;
  }

  if (message.type === 'GET_PAGE_CONTEXT') {
    // Return cached page context or extract fresh
    if (Object.keys(pageContext).length === 0) {
      pageContext = extractPageContext();
    }
    sendResponse({ success: true, pageContext });
    return true;
  }

  if (message.type === 'FILL_FIELD') {
    const success = fillField(message.fieldId, message.answer);
    sendResponse({ success });
    return true;
  }

  if (message.type === 'FILL_ALL_FIELDS') {
    let successCount = 0;
    message.fields.forEach((field: { id: string; answer: string }) => {
      if (fillField(field.id, field.answer)) {
        successCount++;
      }
    });
    sendResponse({ success: true, filled: successCount });
    return true;
  }
});

// Watch for dynamically added form fields
const observer = new MutationObserver(() => {
  // Debounce: only rescan if significant DOM changes occur
  // This prevents excessive scanning on dynamic pages
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

console.log('SubmitMe content script loaded');
