import { callLLM } from './callLLM';
import {
	AUTH_TOKEN,
	CLICKTIME_URL,
	AI_API_KEY,
	STORAGE_KEYS,
} from './constants';
import {
	CombinedJob,
	JobOptionsData,
	TaskControlData,
	TaskOptionsData,
	TimeEntryGuess,
} from './types';

/**
 * Store all data in chrome storage because it feels like a
 * good way to do it in a Chrome extension?
 */
export const storeDataLocally = async (
	key: string,
	data: any,
): Promise<void> => {
	try {
		await chrome.storage.local.set({ [key]: data });
		console.log(`Successfully stored data for key: ${key}`);
	} catch (error) {
		console.error(`Error storing data for key: ${key}`, error);
	}
};

/** Our company has task controls set by project, so just calling all of them */
export const callTaskControls = async () => {
	if (AUTH_TOKEN == null) {
		console.error(
			'API token is not set. Please add it to the env as CLICKTIME_AUTH_TOKEN=YOUR_TOKEN',
		);
		return;
	}

	try {
		// Call task controls to get all tasks to jobs mapping
		const response = await fetch(
			`${CLICKTIME_URL}/v2/Me/Jobs/TaskControls?JobIsActive=true&TaskIsActive=true&limit=50000`,
			{
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `TOKEN ${AUTH_TOKEN}`,
				},
			},
		);

		if (response.ok) {
			const responseData = await response.json();
			await storeDataLocally(STORAGE_KEYS.TASK_CONTROL, responseData.data);
		} else {
			console.error('Failed to fetch task control data.');
		}
	} catch (error) {
		console.error('Error calling task controls:', error);
	}
};

// Function to call the LLM and get time entry suggestions
export const sendToLLMForTimeEntries = async () => {
	try {
		const timeEntrySuggestions = await callLLM();
		await postTimeEntries(timeEntrySuggestions);
	} catch (error) {
		console.error('Error in LLM call:', error);
	}
};

/** Add all the tasks available to a job to the job object itself for more direct AI consumption */
export const combineJobAndTaskData = async () => {
	const result = await chrome.storage.local.get([
		STORAGE_KEYS.JOB,
		STORAGE_KEYS.TASK,
		STORAGE_KEYS.TASK_CONTROL,
	]);

	const jobOptions: JobOptionsData = result[STORAGE_KEYS.JOB];
	const tasks: TaskOptionsData = result[STORAGE_KEYS.TASK];
	const taskControls: TaskControlData = result[STORAGE_KEYS.TASK_CONTROL];

	if (jobOptions == null || tasks == null || taskControls == null) {
		console.warn(
			'Missing job, task, or task control data. Combination skipped.',
		);
		return;
	}

	// Not sure if it's necessary to clone here but doing it so I don't run into stupid bugs later
	const combinedJobOptions: JobOptionsData = { ...jobOptions };
	for (const taskControl of taskControls) {
		const job: CombinedJob = combinedJobOptions.Jobs[taskControl.JobID];
		const taskOption = tasks[taskControl.TaskID];

		if (job != null && taskOption != null) {
			if (job.Tasks == null) {
				job.Tasks = [];
			}
			job.Tasks.push({
				TaskID: taskOption.ID,
				ListDisplayText: taskOption.ListDisplayText,
			});
		}
	}

	await storeDataLocally(STORAGE_KEYS.COMBINED_JOB_TASK, combinedJobOptions);
};

const postTimeEntries = async (entries: TimeEntryGuess[]) => {
	const timeEntriesUrl = `${CLICKTIME_URL}/v2/Me/TimeEntries`;
	// Get calendar date that was grabbed from NGIN endpoint param
	const result = await chrome.storage.local.get([STORAGE_KEYS.CALENDAR_DATE]);
	const date = result[STORAGE_KEYS.CALENDAR_DATE];

	if (date == null || AUTH_TOKEN == null) {
		console.error('Missing date or auth token. Cannot post time entries.');
		return;
	}

	console.log(
		`Starting to post ${entries.length} time entries for date: ${date}`,
	);

	for (const entry of entries) {
		try {
			const response = await fetch(timeEntriesUrl, {
				method: 'POST',
				headers: {
					'content-type': 'application/json',
					Authorization: `Token ${AUTH_TOKEN}`,
				},
				body: JSON.stringify({
					Date: date,
					Hours: roundToNearestMinTimeInc(entry.hours),
					JobID: entry.jobID,
					TaskID: entry.taskID,
					CustomFields: {},
				}),
			});

			// Console log errors
			if (!response.ok) {
				const responseData = await response.json();
				console.error(
					`Failed to post entry for JobID: ${entry.jobID}. Status: ${response.status}`,
					responseData,
				);
			}
		} catch (error) {
			console.error(
				`Network error while posting entry for JobID: ${entry.jobID}`,
				error,
			);
		}
	}

	console.log('Finished posting time entries.');

	try {
		// Then, disable background listener, reload the page, and close the extension.
		await chrome.storage.local.set({ [STORAGE_KEYS.ENABLED]: false });
		console.log('Background listener has been disabled.');

		const tabs = await chrome.tabs.query({
			active: true,
			currentWindow: true,
		});
		if (tabs[0]?.id != null) {
			await chrome.tabs.reload(tabs[0].id);
			console.log('Page has been reloaded.');
		}
	} catch (error) {
		// Doubt this will ever get hit but ¯\_(ツ)_/¯
		console.error('Failed to disable listener or reload page:', error);
	}
};

/** Round to nearest 10. This is set in place because our MinTimeIncrement is 0.1 */
export const roundToNearestMinTimeInc = (num: number) =>
	Math.round(num * 10) / 10;
