import { get, set } from './storage';

/**
 * Return true if the extension is running in development
 *
 * @see https://developer.chrome.com/extensions/management#type-ExtensionInstallType
 */
function runningInDevelopment(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
        chrome.management.getSelf(({ installType }) => {
            resolve(installType === 'development');
        });
    });
}

/**
 * Save to local storage whether we're running in a dev environment
 */
export async function updateDevEnvironmentStatus(): Promise<void> {
    await set({ developmentEnvironment: await runningInDevelopment() });
}

/**
 * Recall from local storage whether we're running in a dev environment
 */
export async function getStoredDevEnvironmentStatus(): Promise<boolean> {
    const result = await get('developmentEnvironment');
    return result.developmentEnvironment;
}

/**
 * Get debug status
 */
async function getDebugStatus(): Promise<boolean> {
    const result = await get('debug');
    return result.debug;
}

/**
 * Set debug status
 * @param newStatus
 */
async function setDebugStatus(newStatus: boolean): Promise<void> {
    set({ debug: newStatus });
}

export { getDebugStatus, setDebugStatus };
