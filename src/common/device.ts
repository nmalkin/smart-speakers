import { Alexa } from './alexa/amazon';
import { Google } from './google/google';
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

    /**
     * Produce an object representing this device
     */
    serialize(): any;
}

/**
 * Given a serialized instance of a device, returns the corresponding object
 *
 * This relies on us knowing that there are only two devices
 * and therefore breaks the Device abstractions.
 * Still, it *is* convenient.
 */
export function unserializeDevice(serializedDevice: any): Device {
    switch (serializedDevice) {
        case Alexa.serialize():
            return Alexa;
        case Google.serialize():
            return Google;
        default:
            throw new Error(`unknown device ${serializedDevice}`);
    }
}
