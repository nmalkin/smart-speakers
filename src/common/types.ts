/**
 * The user's login state for the targeted assistant service
 */
export enum VerificationState {
    loggedIn = 'loggedIn',
    loggedOut = 'loggedOut',
    upgradeRequired = 'upgradeRequired',
    ineligible = 'ineligible',
    error = 'error'
}

export enum DownloadStatus {
    notAttempted = 'notAttempted',
    success = 'success',
    error = 'error',
    maxedOut = 'maxedOut',
    timedOut = 'timedOut'
}

/**
 * The result of performing validation.
 */
export interface ValidationResult {
    /** The result of the eligibility check */
    status: VerificationState;
    /** Code describing what happened in the download process */
    downloadStatus: DownloadStatus;
    /** Interactions downloaded during validation */
    interactions: Interaction[];
    /** Errors that happened during validation */
    errors?: Error[];
    /** If the user is ineligible, this text string explains why */
    ineligiblityReason?: string;
}

/**
 * A pair of an audio recording's URL and its transcript
 */
export interface Interaction {
    /** Is a recording URL available for this interaction? */
    recordingAvailable: boolean;
    url: string;
    transcript: string;
    /** Timestamp, in milliseconds */
    timestamp: number;
}
