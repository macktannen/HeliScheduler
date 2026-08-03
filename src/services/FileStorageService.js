import localforage from 'localforage';

// Configure localforage to use IndexedDB
localforage.config({
  name: 'HelicopterScheduler',
  storeName: 'receipts_store',
  description: 'Stores receipt files for testing purposes'
});

export const FileStorageService = {
  /**
   * Save a file to IndexedDB
   * @param {File} file 
   * @returns {Promise<string>} The unique ID generated for the file
   */
  async saveFile(file) {
    const fileId = `file_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const fileData = {
      name: file.name,
      type: file.type,
      size: file.size,
      blob: file // localforage can store File/Blob objects natively in IndexedDB
    };
    await localforage.setItem(fileId, fileData);
    return fileId;
  },

  /**
   * Get a file from IndexedDB
   * @param {string} fileId 
   * @returns {Promise<Object|null>} The file data object containing { name, type, blob }
   */
  async getFile(fileId) {
    const fileData = await localforage.getItem(fileId);
    return fileData || null;
  },

  /**
   * Delete a file from IndexedDB
   * @param {string} fileId 
   */
  async deleteFile(fileId) {
    await localforage.removeItem(fileId);
  }
};
