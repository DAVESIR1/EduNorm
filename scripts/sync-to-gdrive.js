import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import ignore from 'ignore';

const DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;
const SERVICE_ACCOUNT_KEY_FILE = path.join(process.cwd(), 'service-account.json');

if (!fs.existsSync(SERVICE_ACCOUNT_KEY_FILE)) {
    console.error('Error: service-account.json not found. Please place your Google Service Account key file in the root directory.');
    process.exit(1);
}

if (!DRIVE_FOLDER_ID) {
    console.error('Error: GOOGLE_DRIVE_FOLDER_ID not found in .env');
    process.exit(1);
}

const auth = new google.auth.GoogleAuth({
    keyFile: SERVICE_ACCOUNT_KEY_FILE,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
});

const drive = google.drive({ version: 'v3', auth });

const ig = ignore();
if (fs.existsSync('.gitignore')) {
    ig.add(fs.readFileSync('.gitignore').toString());
}
// Always ignore these
ig.add(['.git', 'node_modules', 'service-account.json', '.env', 'dist']);

async function uploadFile(filePath, parentId) {
    const fileName = path.basename(filePath);
    const fileMetadata = {
        name: fileName,
        parents: [parentId],
    };
    const media = {
        body: fs.createReadStream(filePath),
    };

    try {
        const response = await drive.files.list({
            q: `name = '${fileName}' and '${parentId}' in parents and trashed = false`,
            fields: 'files(id)',
        });

        if (response.data.files && response.data.files.length > 0) {
            const fileId = response.data.files[0].id;
            await drive.files.update({
                fileId: fileId,
                media: media,
            });
            console.log(`Updated: ${fileName}`);
        } else {
            await drive.files.create({
                resource: fileMetadata,
                media: media,
                fields: 'id',
            });
            console.log(`Uploaded: ${fileName}`);
        }
    } catch (error) {
        console.error(`Error uploading ${fileName}:`, error.message);
    }
}

async function syncFolder(localPath, parentId) {
    const entries = fs.readdirSync(localPath, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(localPath, entry.name);
        const relativePath = path.relative(process.cwd(), fullPath);

        if (ig.ignores(relativePath)) continue;

        if (entry.isDirectory()) {
            let remoteFolderId;
            const response = await drive.files.list({
                q: `name = '${entry.name}' and '${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
                fields: 'files(id)',
            });

            if (response.data.files && response.data.files.length > 0) {
                remoteFolderId = response.data.files[0].id;
            } else {
                const folderMetadata = {
                    name: entry.name,
                    mimeType: 'application/vnd.google-apps.folder',
                    parents: [parentId],
                };
                const folder = await drive.files.create({
                    resource: folderMetadata,
                    fields: 'id',
                });
                remoteFolderId = folder.data.id;
                console.log(`Created folder: ${entry.name}`);
            }
            await syncFolder(fullPath, remoteFolderId);
        } else {
            await uploadFile(fullPath, parentId);
        }
    }
}

async function main() {
    console.log('Starting sync to Google Drive...');
    await syncFolder(process.cwd(), DRIVE_FOLDER_ID);
    console.log('Sync completed!');
}

main().catch(console.error);
