import { AI_API_KEY, STORAGE_KEYS } from './constants';
import { CombinedJob, TimeEntryGuess } from './types';

/**
 * Call the LLM with the gathered data, and expect back a type of {@link TimeEntryGuess}
 *
 * Change this if you want to switch off which LLM you're calling
 */
export const callLLM = async (): Promise<TimeEntryGuess[]> => {
	if (AI_API_KEY == null) {
		console.error('AI API key is not set in env.');
		return [];
	}
	try {
		const propmt = await getPrompt();
		const response = await fetch(
			`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${AI_API_KEY}`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					contents: [
						{
							parts: [
								{
									text: propmt,
								},
							],
						},
					],
					generationConfig: {
						temperature: 0.2,
					},
				}),
			},
		);

		if (response.ok) {
			const responseData = await response.json();
			// This will also change depending on what you're calling
			const llmResponseContent =
				responseData.candidates[0].content.parts[0].text;
			// For some reason Gemini adds all this crud - probably not needed if you switch the call
			const jsonString = llmResponseContent.replace(/```json\n|```/g, '');
			return JSON.parse(jsonString);
		} else {
			console.error(`LLM call failed with status: ${response.status}`);
			const errorText = await response.text();
			console.error('LLM error response:', errorText);
			return [];
		}
	} catch (error) {
		console.error('Error in LLM call:', error);
		return [];
	}
};

/** Get the prompt, feel free to edit this how you please */
const getPrompt = async () => {
	const result = await chrome.storage.local.get([
		STORAGE_KEYS.COMBINED_JOB_TASK,
		STORAGE_KEYS.NTB_EVENT,
		STORAGE_KEYS.CALENDAR,
		STORAGE_KEYS.SELECTED_CLIENT,
		STORAGE_KEYS.CUSTOM_MESSAGE,
	]);

	const combinedJobData = result[STORAGE_KEYS.COMBINED_JOB_TASK];
	const ntbEvents = result[STORAGE_KEYS.NTB_EVENT];
	const calendarEvents = result[STORAGE_KEYS.CALENDAR];
	const selectedClient = result[STORAGE_KEYS.SELECTED_CLIENT];
	const customMessage = result[STORAGE_KEYS.CUSTOM_MESSAGE] ?? '';

	if (
		combinedJobData == null ||
		ntbEvents == null ||
		calendarEvents == null ||
		selectedClient == null ||
		selectedClient == ''
	) {
		console.warn('Missing necessary data for LLM call. Skipping.');
		return;
	}
	const filteredJobs = Object.fromEntries(
		Object.entries(combinedJobData.Jobs as CombinedJob).filter(
			([_, job]) => job.ClientID === selectedClient,
		),
	);
	const filteredData = {
		Clients: combinedJobData.Clients,
		Jobs: filteredJobs,
	};

	const combinedJobDataString = JSON.stringify(filteredData, null, 2);
	const ntbEventsString = JSON.stringify(ntbEvents, null, 2);
	const calendarEventsString = JSON.stringify(calendarEvents, null, 2);
	const prompt = `
        You are a time entry creator and a data-retrieval expert. Your task is to analyze calendar and Jira events and suggest time entries. The only source of truth for job and task IDs is the job and tasks JSON data provided below. Do not invent, create, or guess any IDs.

        <jobs_and_tasks_json>
        ${combinedJobDataString}
        </jobs_and_tasks_json>

        <calendar_events_json>
        ${calendarEventsString}
        </calendar_events_json>

        <ntb_events_json>
        ${ntbEventsString}
        </ntb_events_json>

        <user_notes_text>
        ${customMessage}
        </user_notes_text>

        **Thinking Process:**
        1.  Examine the calendar and Jira events.
        2.  For each event, determine the appropriate job.
        3.  Strictly look up the 'jobID' for that job and the 'taskID' for its associated task by searching only within the '<jobs_and_tasks_json>' data. Possible Task IDs can be found within a jobs Task property.
        4.  If a valid 'jobID' and 'taskID' pairing cannot be found, do not create a time entry for that event.
        5.  Suggest what my time entries should be for this work day. All time entries MUST add up to 8 hours, but be less than 9.5 hours. There MUST be no duplicate Job - Task pairings.

        Your response must be a JSON array of objects. Do not include any other text, reasoning, or explanations in your response. Any incorrect ID will result in total failure.

        Each object in the array should have the following fields:
        - jobID: The ID of the job you have chosen.
        - taskID: The ID of the task that corresponds to the chosen job.
        - hours: A number representing the hours to be logged, with an increment of 0.1.

        Example output format:
        [
        {
            "jobID": "4Kw7hWu-WJ3fPFqS31DLxHw2",
            "taskID": "4fQszY-Qu3cdRSLNl6p_rBw2",
            "hours": 3.5
        },
        {
            "jobID": "4RBbJYC0t_xMGdz1D64GPbw2",
            "taskID": "4i8OMI__4Yg4bFYAgEAAvSA2",
            "hours": 2
        }
        ]
    `;
};
