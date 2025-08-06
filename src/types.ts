interface EventData {
	Description: string;
	End: {
		Date: string | null;
		DateTime: string;
		TimeZone: string;
	} | null;
	EventID?: string;
	EventType: string;
	IsAllDayEvent?: boolean;
	IsWorkRelated?: boolean;
	Metadata?: any;
	Start: {
		Date: string | null;
		DateTime: string;
		TimeZone: string;
	} | null;
	SuggestedJobs?: any[];
	TimeEntryID?: string | null;
	Title: string;
}

interface Client {
	ID: string;
	ListDisplayText: string;
}

interface Job {
	ClientID: string;
	EndDate: string | null;
	ID: string;
	ListDisplayText: string;
	StartDate: string | null;
}

export interface CombinedJob extends Job {
	Tasks?: { TaskID: string; ListDisplayText: string }[];
}
export interface JobOptionsData {
	Clients: Record<string, Client>;
	Jobs: Record<string, Job | CombinedJob>;
}

interface TaskOptions {
	ID: string;
	ListDisplayText: string;
}
export type TaskOptionsData = Record<string, TaskOptions>;

interface TaskControl {
	JobID: string;
	TaskID: string;
}
export type TaskControlData = TaskControl[];

export type BackgroundMessage =
	| { type: 'CALENDAR_DATA'; payload: { data: EventData[] } }
	| { type: 'NTB_EVENT_DATA'; payload: { data: EventData[] } }
	| { type: 'JOB_DATA'; payload: { data: JobOptionsData } }
	| { type: 'TASK_DATA'; payload: { data: TaskOptionsData } }
	| { type: 'CALENDAR_DATE'; payload: string };

export interface TimeEntryGuess {
	jobID: string;
	taskID: string;
	hours: number;
}
