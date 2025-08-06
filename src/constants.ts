export const CLICKTIME_URL = 'https://app.clicktime.com';

export const STORAGE_KEYS = {
	CALENDAR: 'calendarData',
	NTB_EVENT: 'ntbEventData',
	JOB: 'jobData',
	TASK: 'taskOptionsData',
	TASK_CONTROL: 'taskControlsData',
	COMBINED_JOB_TASK: 'combinedJobTaskData',
	SELECTED_CLIENT: 'selectedClient',
	CUSTOM_MESSAGE: 'customMessage',
	CALENDAR_DATE: 'calendarDate',
	ENABLED: 'enabled',
} as const;

export const MESSAGE_TYPES = {
	CALENDAR: 'CALENDAR_DATA',
	NTB_EVENT: 'NTB_EVENT_DATA',
	JOB: 'JOB_DATA',
	TASK: 'TASK_DATA',
	CALENDAR_DATE: 'CALENDAR_DATE',
} as const;

export const RESPONSE_TYPES = {
	CALENDAR: 'CALENDAR_RESPONSE',
	NTB_EVENT: 'NTB_EVENT_RESPONSE',
	JOB: 'JOB_RESPONSE',
	TASK: 'TASK_RESPONSE',
	CALENDAR_DATE: 'CALENDAR_DATE_RESPONSE',
} as const;

export const AUTH_TOKEN = process.env.CLICKTIME_AUTH_TOKEN;
export const AI_API_KEY = process.env.AI_API_KEY;
