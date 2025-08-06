import { MESSAGE_TYPES, RESPONSE_TYPES } from './constants';

// This content script acts as a bridge between the webpage's DOM and the Chrome Extension's
// environment (e.g., the background script). It handles two primary tasks:
// 1. Injecting a secondary script into the page context.
// 2. Listening for messages from that injected script and forwarding them to the extension.

/**
 * Injects a script into the current webpage's context.
 *
 * This is necessary because content scripts operate in an isolated world and
 * cannot access the webpage's JavaScript variables or functions directly.
 * The injected script can, allowing it to read and interact with the page's DOM
 * and then pass data back to this content script via the `window.postMessage` API.
 */
const injectScript = () => {
	const script = document.createElement('script');
	script.src = chrome.runtime.getURL('dist/injected.js');
	(document.head ?? document.documentElement).appendChild(script);
};

// Listen for messages from the injected script on the window object.
// This is the primary communication channel from the injected script to this content script.
window.addEventListener('message', (event) => {
	// Only accept messages from ourselves
	if (event.source !== window || event.data.type == null) {
		return;
	}

	switch (event.data.type) {
		case RESPONSE_TYPES.CALENDAR:
			chrome.runtime.sendMessage({
				type: MESSAGE_TYPES.CALENDAR,
				payload: event.data.payload,
			});
			break;

		case RESPONSE_TYPES.NTB_EVENT:
			chrome.runtime.sendMessage({
				type: MESSAGE_TYPES.NTB_EVENT,
				payload: event.data.payload,
			});
			break;

		case RESPONSE_TYPES.JOB:
			chrome.runtime.sendMessage({
				type: MESSAGE_TYPES.JOB,
				payload: event.data.payload,
			});
			break;

		case RESPONSE_TYPES.TASK:
			chrome.runtime.sendMessage({
				type: MESSAGE_TYPES.TASK,
				payload: event.data.payload,
			});
			break;

		case RESPONSE_TYPES.CALENDAR_DATE:
			chrome.runtime.sendMessage({
				type: MESSAGE_TYPES.CALENDAR_DATE,
				payload: event.data.payload,
			});
			break;

		default:
			// Ignore other messages
			break;
	}
});

injectScript();
