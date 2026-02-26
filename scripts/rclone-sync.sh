# Sync script using rclone

PROJECT_ROOT="/home/davesir/Documents/EduNorm"
RCLONE_BIN="$PROJECT_ROOT/rclone-v1.65.1-linux-amd64/rclone"
CONFIG_FILE="$PROJECT_ROOT/rclone.conf"
FOLDER_ID="1DaSjEh5VEgLX8e1jmTNLTCqjNFbnIOvj"

if [ ! -f "$RCLONE_BIN" ]; then
    echo "Error: rclone not found at $RCLONE_BIN"
    exit 1
fi

echo "Starting sync to Google Drive folder $FOLDER_ID..."

# We use 'sync' to make Google Drive match the local folder
# --drive-root-folder-id allows syncing to a specific folder without full drive access
# --exclude-from avoids syncing unwanted files
$RCLONE_BIN sync "$PROJECT_ROOT" "gdrive:" \
    --config "$CONFIG_FILE" \
    --drive-root-folder-id "$FOLDER_ID" \
    --exclude-from "$PROJECT_ROOT/.rclone-exclude" \
    --verbose

echo "Sync completed!"
