import { get, set } from './storage';

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
