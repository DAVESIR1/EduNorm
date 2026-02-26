#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  EduNorm Smart Google Drive Sync
#  Auto-detects which side is newer and syncs accordingly
# ═══════════════════════════════════════════════════════════════

PROJECT_ROOT="/home/davesir/Documents/EduNorm"
RCLONE_BIN="$PROJECT_ROOT/rclone-v1.65.1-linux-amd64/rclone"
CONFIG_FILE="$PROJECT_ROOT/rclone.conf"
FOLDER_ID="1DaSjEh5VEgLX8e1jmTNLTCqjNFbnIOvj"
EXCLUDE_FILE="$PROJECT_ROOT/.rclone-exclude"
LOG_FILE="$PROJECT_ROOT/sync-log.txt"

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# ── Preflight Checks ──────────────────────────────────────────
if [ ! -f "$RCLONE_BIN" ]; then
    echo -e "${RED}✗ Error: rclone not found at $RCLONE_BIN${NC}"
    exit 1
fi

if [ ! -f "$CONFIG_FILE" ]; then
    echo -e "${RED}✗ Error: rclone.conf not found at $CONFIG_FILE${NC}"
    exit 1
fi

echo -e "${BOLD}${CYAN}"
echo "  ╔═══════════════════════════════════════════╗"
echo "  ║     EduNorm Smart Google Drive Sync       ║"
echo "  ╚═══════════════════════════════════════════╝"
echo -e "${NC}"
echo -e "${BLUE}⏰ Started at: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo ""

# ── Step 1: Get the newest file timestamp on Google Drive ─────
echo -e "${YELLOW}📡 Step 1: Scanning Google Drive for newest file...${NC}"

# Get Drive file listing with timestamps, find the newest
DRIVE_NEWEST_LINE=$($RCLONE_BIN lsl gdrive: \
    --config "$CONFIG_FILE" \
    --drive-root-folder-id "$FOLDER_ID" \
    2>/dev/null | sort -k2,3 | tail -1)

if [ -z "$DRIVE_NEWEST_LINE" ]; then
    echo -e "${RED}✗ Could not read Google Drive folder. Check your connection/auth.${NC}"
    exit 1
fi

DRIVE_NEWEST_DATE=$(echo "$DRIVE_NEWEST_LINE" | awk '{print $2}')
DRIVE_NEWEST_TIME=$(echo "$DRIVE_NEWEST_LINE" | awk '{print $3}' | cut -d. -f1)
DRIVE_NEWEST_FILE=$(echo "$DRIVE_NEWEST_LINE" | awk '{$1=$2=$3=""; print $0}' | sed 's/^[[:space:]]*//')
DRIVE_NEWEST_TS=$(date -d "$DRIVE_NEWEST_DATE $DRIVE_NEWEST_TIME" +%s 2>/dev/null || echo "0")

echo -e "   Drive newest: ${GREEN}$DRIVE_NEWEST_FILE${NC}"
echo -e "   Drive time:   ${GREEN}$DRIVE_NEWEST_DATE $DRIVE_NEWEST_TIME${NC}"
echo ""

# ── Step 2: Get the newest file timestamp locally ─────────────
echo -e "${YELLOW}💻 Step 2: Scanning local files for newest file...${NC}"

# Find the newest file locally, excluding ignored paths
LOCAL_NEWEST_FILE=$(find "$PROJECT_ROOT" \
    -not -path '*/node_modules/*' \
    -not -path '*/.git/*' \
    -not -path '*/dist/*' \
    -not -path '*/rclone-v1.65.1-linux-amd64/*' \
    -not -path '*/.env' \
    -not -path '*/service-account.json' \
    -not -name '*.zip' \
    -not -name 'rclone.conf' \
    -not -name 'sync-log.txt' \
    -type f -printf '%T@ %p\n' 2>/dev/null | sort -n | tail -1)

LOCAL_NEWEST_TS=$(echo "$LOCAL_NEWEST_FILE" | awk '{print int($1)}')
LOCAL_NEWEST_PATH=$(echo "$LOCAL_NEWEST_FILE" | awk '{$1=""; print $0}' | sed 's/^[[:space:]]*//')
LOCAL_NEWEST_DISPLAY=$(echo "$LOCAL_NEWEST_PATH" | sed "s|$PROJECT_ROOT/||")
LOCAL_NEWEST_HUMAN=$(date -d @"$LOCAL_NEWEST_TS" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || echo "unknown")

echo -e "   Local newest: ${GREEN}$LOCAL_NEWEST_DISPLAY${NC}"
echo -e "   Local time:   ${GREEN}$LOCAL_NEWEST_HUMAN${NC}"
echo ""

# ── Step 3: Compare and Decide ────────────────────────────────
echo -e "${YELLOW}🔍 Step 3: Comparing timestamps...${NC}"

DIFF=$((LOCAL_NEWEST_TS - DRIVE_NEWEST_TS))

if [ "$DIFF" -gt 60 ]; then
    echo -e "   ${GREEN}▲ Local is NEWER by $(($DIFF / 60)) minutes${NC}"
    echo -e "   ${BOLD}→ Strategy: PUSH local changes to Drive first, then pull any Drive-only files${NC}"
    DIRECTION="push_first"
elif [ "$DIFF" -lt -60 ]; then
    ABS_DIFF=$(( -DIFF ))
    echo -e "   ${GREEN}▼ Drive is NEWER by $(($ABS_DIFF / 60)) minutes${NC}"
    echo -e "   ${BOLD}→ Strategy: PULL Drive changes first, then push any local-only files${NC}"
    DIRECTION="pull_first"
else
    echo -e "   ${GREEN}≈ Both sides are roughly in sync (within 60s)${NC}"
    echo -e "   ${BOLD}→ Strategy: Bidirectional sync (copy missing files both ways)${NC}"
    DIRECTION="both"
fi
echo ""

# Common rclone args
RCLONE_ARGS="--config $CONFIG_FILE --drive-root-folder-id $FOLDER_ID --verbose"
if [ -f "$EXCLUDE_FILE" ]; then
    RCLONE_ARGS="$RCLONE_ARGS --exclude-from $EXCLUDE_FILE"
fi

# ── Step 4: Execute Sync ──────────────────────────────────────
if [ "$DIRECTION" = "push_first" ]; then
    echo -e "${YELLOW}📤 Step 4a: Pushing local → Google Drive...${NC}"
    $RCLONE_BIN copy "$PROJECT_ROOT" gdrive: $RCLONE_ARGS 2>&1 | grep -E "INFO|NOTICE|ERROR"
    echo ""
    echo -e "${YELLOW}📥 Step 4b: Pulling Google Drive → local (missing files only)...${NC}"
    $RCLONE_BIN copy gdrive: "$PROJECT_ROOT" $RCLONE_ARGS 2>&1 | grep -E "INFO|NOTICE|ERROR"

elif [ "$DIRECTION" = "pull_first" ]; then
    echo -e "${YELLOW}📥 Step 4a: Pulling Google Drive → local...${NC}"
    $RCLONE_BIN copy gdrive: "$PROJECT_ROOT" $RCLONE_ARGS 2>&1 | grep -E "INFO|NOTICE|ERROR"
    echo ""
    echo -e "${YELLOW}📤 Step 4b: Pushing local → Google Drive (missing files only)...${NC}"
    $RCLONE_BIN copy "$PROJECT_ROOT" gdrive: $RCLONE_ARGS 2>&1 | grep -E "INFO|NOTICE|ERROR"

else
    # Bidirectional — copy missing/updated files both ways
    echo -e "${YELLOW}📥 Step 4a: Pulling Google Drive → local...${NC}"
    $RCLONE_BIN copy gdrive: "$PROJECT_ROOT" $RCLONE_ARGS 2>&1 | grep -E "INFO|NOTICE|ERROR"
    echo ""
    echo -e "${YELLOW}📤 Step 4b: Pushing local → Google Drive...${NC}"
    $RCLONE_BIN copy "$PROJECT_ROOT" gdrive: $RCLONE_ARGS 2>&1 | grep -E "INFO|NOTICE|ERROR"
fi

echo ""

# ── Step 5: Summary ───────────────────────────────────────────
echo -e "${BOLD}${GREEN}"
echo "  ╔═══════════════════════════════════════════╗"
echo "  ║         ✅ Sync Complete!                 ║"
echo "  ╚═══════════════════════════════════════════╝"
echo -e "${NC}"
echo -e "${BLUE}⏰ Finished at: $(date '+%Y-%m-%d %H:%M:%S')${NC}"

# Log the sync
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Sync completed - Direction: $DIRECTION" >> "$LOG_FILE"

echo ""
echo -e "${CYAN}Press Enter to close...${NC}"
read -r
