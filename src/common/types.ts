export enum Device {
    alexa = 'alexa',
    google = 'google'
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
