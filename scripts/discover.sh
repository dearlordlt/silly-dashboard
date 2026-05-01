#!/usr/bin/env bash
# silly-dashboard service discovery
#
# Run this ON the node you want to enumerate (e.g. ssh into Mac mini, then
# `bash discover.sh`). Outputs a JSON fragment ready to merge into the
# `services` array of data/config.json.
#
# It looks at:
#   - Docker containers (`docker ps`) with published ports
#   - All TCP listeners (`lsof -iTCP -sTCP:LISTEN -P -n`)
#   - A small known-port lookup table for common self-hosted services
#
# Anything it can't classify shows up as "unknown" so you can name it manually.

set -euo pipefail

NODE_ID="${1:-macmini}"
HOST="${2:-127.0.0.1}"

# --- known ports --------------------------------------------------------------
# format: "port|name|category|icon|description|path"
KNOWN=$(cat <<'EOF'
8096|Jellyfin|media|play|Media server|/web/
9696|Prowlarr|arr|search|Indexer manager|
8989|Sonarr|arr|tv|TV automation|
7878|Radarr|arr|clapperboard|Movie automation|
8686|Lidarr|arr|music|Music automation|
6767|Bazarr|arr|subtitles|Subtitle automation|
9091|Transmission|downloads|download|Torrent client|/transmission/web/
8080|qBittorrent|downloads|download|Torrent client|
9117|Jackett|arr|search|Indexer proxy|
5055|Overseerr|media|search|Request manager|
5056|Jellyseerr|media|search|Request manager|
9000|Portainer|admin|container|Docker UI|
3000|Dashboard|admin|globe|Web app|
8123|Home Assistant|admin|home|Home automation|
32400|Plex|media|play|Media server|/web
2283|Immich|media|image|Photo library|
8581|FileBrowser|admin|folder|File manager|
3030|silly-dashboard|admin|sparkles|This dashboard|
8888|Caddy admin|admin|globe|Reverse proxy admin|
80|Web|admin|globe|HTTP|
443|Web|admin|globe|HTTPS|
19999|Netdata|monitoring|activity|Realtime metrics|
61208|Glances|monitoring|activity|System metrics|
9090|Prometheus|monitoring|activity|Metrics DB|
3001|Grafana|monitoring|activity|Dashboards|
EOF
)

lookup() {
	local port="$1"
	echo "$KNOWN" | awk -F'|' -v p="$port" '$1 == p { print; exit }'
}

# --- collect listeners --------------------------------------------------------
declare -a listeners=()

if command -v lsof >/dev/null 2>&1; then
	while IFS= read -r line; do
		# extract port from address column (last :PORT)
		port=$(echo "$line" | awk '{print $9}' | sed 's/.*://; s/[^0-9]//g')
		[ -z "$port" ] && continue
		# skip ephemeral / random
		(( port < 1 || port > 65535 )) && continue
		listeners+=("$port")
	done < <(lsof -iTCP -sTCP:LISTEN -P -n 2>/dev/null | tail -n +2)
fi

# de-dupe + sort
mapfile -t ports < <(printf '%s\n' "${listeners[@]}" | sort -un)

# --- emit json ----------------------------------------------------------------
first=1
echo '['
for port in "${ports[@]}"; do
	# skip very common system stuff
	case "$port" in
		22|53|139|445|548|631|3283|5353|7000|49152|49153|49154|49155|62078) continue;;
	esac

	row=$(lookup "$port")
	if [ -n "$row" ]; then
		IFS='|' read -r _ name category icon description path <<< "$row"
	else
		name="port-$port"
		category="other"
		icon="globe"
		description="Discovered listener"
		path=""
	fi

	id=$(echo "$name-$port" | tr '[:upper:] ' '[:lower:]-' | tr -cd 'a-z0-9-')

	[ $first -eq 0 ] && echo ","
	first=0
	cat <<JSON
	{
		"id": "$id",
		"name": "$name",
		"url": "http://$HOST:$port$path",
		"category": "$category",
		"icon": "$icon",
		"nodeId": "$NODE_ID",
		"description": "$description"
	}
JSON
done
echo
echo ']'

# --- docker (informational, written to stderr so stdout stays valid JSON) -----
if command -v docker >/dev/null 2>&1; then
	{
		echo
		echo "# Detected Docker containers:"
		docker ps --format '#   {{.Names}}  ->  {{.Image}}   ports: {{.Ports}}' 2>/dev/null || true
	} >&2
fi
