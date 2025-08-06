import { CLICKTIME_URL, MESSAGE_TYPES, STORAGE_KEYS } from './constants';
import { BackgroundMessage } from './types';
import {
	callTaskControls,
	combineJobAndTaskData,
	storeDataLocally,
} from './utils';

/**
 * Set up a persistent background listener that will locally store all messages received
 * that coincide with the message types we want to listen to.
 */
chrome.runtime.onMessage.addListener(
	async (message: BackgroundMessage, _sender, _sendResponse) => {
		const result = await chrome.storage.local.get(STORAGE_KEYS.ENABLED);
		const isEnabled: Boolean = result[STORAGE_KEYS.ENABLED] ?? false;

		if (!isEnabled) {
			console.log('Extension is disabled. Skipping data processing.');
			return;
		}

		switch (message.type) {
			case MESSAGE_TYPES.CALENDAR: {
				const data = message.payload.data.map(
					({ Start, End, Title, Description, EventType }) => ({
						Start,
						End,
						Title,
						Description,
						EventType,
					}),
				);
				await storeDataLocally(STORAGE_KEYS.CALENDAR, data);
				break;
			}

			case MESSAGE_TYPES.NTB_EVENT: {
				const data = message.payload.data.map(
					({ Start, End, Title, Description, EventType }) => ({
						Start,
						End,
						Title,
						Description,
						EventType,
					}),
				);
				await storeDataLocally(STORAGE_KEYS.NTB_EVENT, data);
				break;
			}

			case MESSAGE_TYPES.JOB: {
				const data = message.payload.data;
				await storeDataLocally(STORAGE_KEYS.JOB, data);
				// Combine the task controls data with the jobs we've intercepted. Only runs if tasks message finishes first.
				await combineJobAndTaskData();
				break;
			}

			case MESSAGE_TYPES.TASK: {
				const data = message.payload.data;
				// Call task controls at this point
				await callTaskControls();
				await storeDataLocally(STORAGE_KEYS.TASK, data);
				// Combine the task controls data with the jobs we've intercepted. Only runs if jobs message finishes first.
				await combineJobAndTaskData();
				break;
			}

			case MESSAGE_TYPES.CALENDAR_DATE: {
				await storeDataLocally(STORAGE_KEYS.CALENDAR_DATE, message.payload);
				break;
			}

			default:
				console.log(
					'Received an unhandled message type:',
					(message as any).type,
				);
				break;
		}
	},
);

/** Clear local storage on navigation */
chrome.webNavigation.onCommitted.addListener(
	(details) => {
		if (details.url.includes(CLICKTIME_URL)) {
			console.log(
				'Navigation detected on clicktime.com, clearing local storage.',
			);

			// Clear all keys
			chrome.storage.local.remove(Object.values(STORAGE_KEYS), () => {
				if (chrome.runtime.lastError != null) {
					console.error('Error clearing storage:', chrome.runtime.lastError);
				} else {
					console.log('Successfully cleared specified storage keys.');
				}
			});
		}
	},
	{
		url: [{ hostSuffix: 'clicktime.com' }],
	},
);
