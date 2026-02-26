$RCLONE_EXE = "C:\Users\acer\rclone\rclone.exe"
$CONFIG_PATH = "C:\Users\acer\Documents\EduNorm\rclone.conf"
$LOCAL_FOLDER = "C:\Users\acer\Documents\EduNorm"
$REMOTE_FOLDER = "gdrive:EduNorm"
$EXCLUDE_FILE = "C:\Users\acer\Documents\EduNorm\.rclone-exclude"

if (Test-Path $EXCLUDE_FILE) {
    & $RCLONE_EXE sync $LOCAL_FOLDER $REMOTE_FOLDER --config $CONFIG_PATH --exclude-from $EXCLUDE_FILE --verbose --progress
} else {
    & $RCLONE_EXE sync $LOCAL_FOLDER $REMOTE_FOLDER --config $CONFIG_PATH --verbose --progress
}
