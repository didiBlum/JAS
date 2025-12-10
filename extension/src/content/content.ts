import { FormField } from '../types';

let detectedFields: FormField[] = [];

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
    });
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
