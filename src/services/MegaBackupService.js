import { Storage } from 'megajs';
import AnigmaEncoding from './AnigmaEncoding';

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

// Helper: Find or create a folder within a parent folder
async function findOrCreateFolder(parent, name) {
    let folder = parent.children?.find(f => f.name === name);
    if (!folder) {
        console.log(`MegaBackup: Creating folder '${name}'...`);
        folder = await parent.mkdir(name);
    }
    return folder;
}

/**
 * Upload Data to Mega with specific role-based structure
 * 
 * Paths:
 * - HOI: /{School}/WholeSchoolData/backup.json
 * - Teacher: /{School}/Teachers/{Name}_{ID}/data.json
 * - Student: /{School}/Students/{Name}_{ID}/data.json
 */
export async function uploadToMega(data, schoolName = 'Unknown', schoolId = '000', role = 'hoi', userName = 'User', userId = '000') {
    try {
        const mega = await getStorage();
        if (!mega) throw new Error('Could not connect to Mega');

        // 1. Root: EduNorm_Backups (Stay readable for admin context)
        const rootFolder = await findOrCreateFolder(mega.root, 'EduNorm_Backups');

        // 2. School Folder: Encoded(SchoolName_SchoolId)
        console.log('MegaBackup: Encoding school folder name...');
        const rawSchoolFolder = `${schoolName}_${schoolId}`;
        const encodedSchoolFolder = AnigmaEncoding.encode(rawSchoolFolder);
        const schoolFolder = await findOrCreateFolder(rootFolder, encodedSchoolFolder);

        // 3. Subfolder based on Role
        let roleFolderName = role === 'hoi' || role === 'admin' ? 'WholeSchoolData' : (role === 'teacher' ? 'Teachers' : 'Students');
        const encodedRoleFolder = AnigmaEncoding.encode(roleFolderName);
        const roleFolder = await findOrCreateFolder(schoolFolder, encodedRoleFolder);

        let targetFolder = roleFolder;

        // 4. User Folder: Encoded(UserName_UserId) for non-HOI
        if (role !== 'hoi' && role !== 'admin') {
            const rawUserFolder = `${userName}_${userId}`;
            const encodedUserFolder = AnigmaEncoding.encode(rawUserFolder);
            targetFolder = await findOrCreateFolder(roleFolder, encodedUserFolder);
        }

        // 4. Prepare File (ANIGMA ENCODING)
        console.log('MegaBackup: Encoding data with Anigma...');

        let fileContent;
        try {
            const encodedString = AnigmaEncoding.encode(data);
            const encryptedPackage = {
                encrypted: encodedString,
                version: '3.0-anigma',
                timestamp: new Date().toISOString(),
                metadata: {
                    role,
                    schoolName,
                    userId
                }
            };
            fileContent = JSON.stringify(encryptedPackage, null, 2);
        } catch (encError) {
            console.error('MegaBackup: Encoding failed, falling back to plaintext (Safety Net)', encError);
            fileContent = JSON.stringify(data, null, 2);
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `backup_${role}_${timestamp}.json`;
        const buffer = Buffer.from(fileContent);

        // 5. Upload
        console.log(`MegaBackup: Uploading ${filename} to ${targetFolder.name}...`);
        await targetFolder.upload(filename, buffer).complete;

        console.log('MegaBackup: Upload Complete!');
        return { success: true, path: `${schoolFolder.name}/${targetFolder.name}/${filename}` };

    } catch (error) {
        console.error('MegaBackup: Upload Failed', error);
        return { success: false, error: error.message };
    }
}

export default {
    uploadToMega
};
