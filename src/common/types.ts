export enum Device {
    alexa = 'alexa',
    google = 'google',
    error = 'error'
}

/**
 * The user's login state for the targeted assistant service
 */
export enum VerificationState {
    loggedIn = 'loggedIn',
    loggedOut = 'loggedOut',
    ineligible = 'ineligible',
    error = 'error'
}

/**
 * The result of performing validation.
 */
export interface ValidationResult {
    status: VerificationState;
    urls?: string[];
    transcripts?: string[];
}

/**
 * A pair of an audio recording's URL and its transcript
 */
export interface Interaction {
    url: string;
    transcript: string;
}
