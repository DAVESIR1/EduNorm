import { Storage } from 'megajs';

// CREDENTIALS from .env
const MEGA_EMAIL = import.meta.env.VITE_MEGA_EMAIL;
const MEGA_PASS = import.meta.env.VITE_MEGA_PASS;


let storage = null;

/**
 * Initialize and Login to Mega
 */
async function getStorage() {
    if (storage && storage.ready) return storage;

    console.log('MegaBackup: Connecting...');
    return new Promise((resolve, reject) => {
        try {
            const tempStorage = new Storage({
                email: MEGA_EMAIL,
                password: MEGA_PASS
            });

            tempStorage.on('ready', () => {
                console.log('MegaBackup: Connected!');
                storage = tempStorage;
                resolve(storage);
            });

            tempStorage.on('error', (err) => {
                console.error('MegaBackup: Connection Error', err);
                reject(err);
            });
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Upload Data to Mega in a specific folder structure
 * Structure: /EduNorm_Backups/{SchoolName}_{SchoolID}/backup_{timestamp}.json
 */
export async function uploadToMega(data, schoolName = 'Unknown_School', schoolId = '000') {
    try {
        const mega = await getStorage();

        // 1. Find or Create Root Folder "EduNorm_Backups"
        let rootFolder = mega.root.children.find(f => f.name === 'EduNorm_Backups');
        if (!rootFolder) {
            console.log('MegaBackup: Creating root folder...');
            rootFolder = await mega.root.mkdir('EduNorm_Backups');
        }

        // 2. Find or Create School Folder
        const schoolFolderName = `${schoolName.replace(/[^a-zA-Z0-9]/g, '_')}_${schoolId}`;
        let schoolFolder = rootFolder.children.find(f => f.name === schoolFolderName);
        if (!schoolFolder) {
            console.log(`MegaBackup: Creating folder for ${schoolName}...`);
            schoolFolder = await rootFolder.mkdir(schoolFolderName);
        }

        // 3. Prepare File
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `backup_${timestamp}.json`;
        const fileContent = JSON.stringify(data, null, 2);
        const buffer = Buffer.from(fileContent);

        // 4. Upload
        console.log(`MegaBackup: Uploading ${filename}...`);
        await schoolFolder.upload(filename, buffer).complete;

        console.log('MegaBackup: Upload Complete!');
        return { success: true, path: `${schoolFolderName}/${filename}` };

    } catch (error) {
        console.error('MegaBackup: Upload Failed', error);
        return { success: false, error: error.message };
    }
}

export default {
    uploadToMega
};
