/**
 * This module exposes the chrome.storage APIs as promises for easier use.
 */

/**
 * Gets one or more items from storage
 * @param keys A single key to get, list of keys to get, or a dictionary specifying default values.
 * An empty list or object will return an empty result object. Pass in null to get the entire contents of storage.
 */
function get(
    keys: string | string[] | object | null
): Promise<{ [key: string]: any }> {
    return new Promise((resolve, reject) => {
        try {
            chrome.storage.local.get(keys, items => {
                resolve(items);
            });
        } catch (err) {
            reject(err);
        }
    });
}
/**
 * Sets items in storage
 * @param items An object which gives each key/value pair to update storage with. Any other key/value pairs in storage will not be affected.
 */
function set(items: object): Promise<void> {
    return new Promise((resolve, reject) => {
        try {
            chrome.storage.local.set(items, () => {
                resolve();
            });
        } catch (err) {
            reject(err);
        }
    });
}

export { get, set };
