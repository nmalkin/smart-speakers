import { ValidationResult } from './types';

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
