/**
 * A Device used in our study
 */
export interface Device {
    /**
     * The name of the account associated with the given device
     * (i.e., Amazon or Google)
     */
    readonly accountName: string;

    /**
     * The login URL associated with the given device
     */
    readonly loginURL: string;

    /**
     * Validate the login status of the current user
     */
    validate(): Promise<ValidationResult>;
}

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
