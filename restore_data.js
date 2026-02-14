
(async () => {
    console.log("--- STARTING RESTORE FROM FILE ---");
    try {
        const { importAllData } = await import('/src/services/database.js');

        console.log("Fetching backup file...");
        const response = await fetch('/backup_restore.json');
        if (!response.ok) throw new Error("Failed to fetch backup file");

        const backupData = await response.json();
        console.log("Backup file loaded. Importing...", Object.keys(backupData));

        // Ensure data format matches what importAllData expects
        // database.js importAllData takes { settings, students, standards, customFields, ledger }
        await importAllData(backupData);

        console.log("RESTORE COMPLETE!");
        return "Restore Success";
    } catch (e) {
        console.error("Restore Failed:", e);
        return "Error: " + e.message;
    }
})();
