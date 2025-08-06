import { STORAGE_KEYS } from './constants';
import { sendToLLMForTimeEntries } from './utils';

let createEntriesButton: HTMLButtonElement | null;

document.addEventListener('DOMContentLoaded', async () => {
	const toggleListenerSwitch = document.querySelector<HTMLInputElement>(
		'#toggleListenerSwitch',
	);
	const clientSelector =
		document.querySelector<HTMLSelectElement>('#clientSelector');
	const customMessageInput =
		document.querySelector<HTMLTextAreaElement>('#customMessage');
	createEntriesButton = document.querySelector<HTMLButtonElement>(
		'#createEntriesButton',
	);

	if (toggleListenerSwitch != null) {
		const loadToggleState = () => {
			chrome.storage.local.get(STORAGE_KEYS.ENABLED, (result) => {
				toggleListenerSwitch.checked = result[STORAGE_KEYS.ENABLED] ?? false;
			});
		};

		const saveToggleState = () => {
			chrome.storage.local.set({
				[STORAGE_KEYS.ENABLED]: toggleListenerSwitch.checked,
			});
		};

		// Load the state from storage when the popup is first opened
		loadToggleState();
		toggleListenerSwitch.addEventListener('change', saveToggleState);
	}

	if (clientSelector != null) {
		// Populate the clientSelector with values
		const loadClientData = async () => {
			await chrome.storage.local.remove(STORAGE_KEYS.SELECTED_CLIENT);

			const result = await chrome.storage.local.get([STORAGE_KEYS.JOB]);
			const jobOptions = result[STORAGE_KEYS.JOB];

			if (jobOptions != null && jobOptions.Clients != null) {
				clientSelector.innerHTML = '<option value="">No Clients</option>';
				clientSelector.value = '';

				for (const clientID in jobOptions.Clients) {
					const client = jobOptions.Clients[clientID];
					const option = document.createElement('option');
					option.value = client.ID;
					option.textContent = client.ListDisplayText;
					clientSelector.appendChild(option);
				}
			}
		};

		// Save the selected client ID to storage when the dropdown changes
		clientSelector.addEventListener('change', async () => {
			await chrome.storage.local.set({
				[STORAGE_KEYS.SELECTED_CLIENT]: clientSelector.value,
			});
		});

		loadClientData();
	}

	if (createEntriesButton != null && customMessageInput != null) {
		createEntriesButton.addEventListener('click', async () => {
			const customMessage = customMessageInput.value;
			// This should always be there
			createEntriesButton!.disabled = true;

			await chrome.storage.local.set({
				[STORAGE_KEYS.CUSTOM_MESSAGE]: customMessage,
			});

			// Trigger the LLM call
			await sendToLLMForTimeEntries();

			window.close();
		});
	}
});

/** Disable the button if all requirements to send to LLM are not met */
chrome.storage.onChanged.addListener(async (changes, areaName) => {
	if (areaName === 'local') {
		const watchedKeys = [
			STORAGE_KEYS.COMBINED_JOB_TASK,
			STORAGE_KEYS.NTB_EVENT,
			STORAGE_KEYS.CALENDAR,
			STORAGE_KEYS.SELECTED_CLIENT,
		];

		const relevantChange = watchedKeys.some((key) => changes[key]);

		if (relevantChange && createEntriesButton != null) {
			const result = await chrome.storage.local.get(watchedKeys);

			const isDataReady =
				result[STORAGE_KEYS.COMBINED_JOB_TASK] != null &&
				result[STORAGE_KEYS.NTB_EVENT] != null &&
				result[STORAGE_KEYS.CALENDAR] != null &&
				result[STORAGE_KEYS.SELECTED_CLIENT] != null &&
				result[STORAGE_KEYS.SELECTED_CLIENT] !== '';

			createEntriesButton.disabled = !isDataReady;
		}
	}
});
