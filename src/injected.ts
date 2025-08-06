import { RESPONSE_TYPES } from "./constants";

const handleResponse = (response: Response, type: string) => {
  const clonedResponse = response.clone();
  clonedResponse.json().then(data => {
    window.postMessage({
      type,
      payload: data
    }, '*');
  });
};

const originalFetch = window.fetch;

// Override the native fetch function to intercept responses
window.fetch = async (...args) => {
  const response = await originalFetch(...args);

  const url = args[0] instanceof Request ? args[0].url : '';

  switch (true) {
    case url.includes('/Me/Internal/CalendarEvents'):
      try {
        const urlObj = new URL(url);
        const date = urlObj.searchParams.get('date');
        if (date != null) {
          window.postMessage({
            type: RESPONSE_TYPES.CALENDAR_DATE,
            payload: date
          }, '*');
        }
      } catch (error) {
        console.error('Failed to parse URL for calendar date:', error);
      }
      handleResponse(response, RESPONSE_TYPES.CALENDAR);
      break;

    case url.includes('/Me/Internal/NonTimeBoundEvents'):
      handleResponse(response, RESPONSE_TYPES.NTB_EVENT);
      break;

    case url.includes('/Me/Internal/JobDropdownOptions'):
      handleResponse(response, RESPONSE_TYPES.JOB);
      break;

    case url.includes('/Internal/TaskDropdownOptions'):
      handleResponse(response, RESPONSE_TYPES.TASK);
      break;

    default:
      // Otherwise, do nothing
      break;
  }

  // Return the original response so the page functions as normal
  return response;
};