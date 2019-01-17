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

/**
 * The result of performing validation.
 */
export interface ValidationResult {
    status: VerificationState;
    interactions?: Interaction[];
    errors?: Error[];
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
