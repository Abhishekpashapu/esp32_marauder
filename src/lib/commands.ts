// Quick-action commands rendered as buttons.
// Full ESP32 firmware command set (Ghost ESP / Marauder-style toolkit).
// Categories map to UI groups with icons in CommandButtons.tsx.

export type CommandCategory =
  | "system"
  | "wifi_scan"
  | "sniffing"
  | "wifi_attacks"
  | "bluetooth"
  | "storage"
  | "gps";

export interface CommandSpec {
  id: string;
  label: string;
  command: string;
  category: CommandCategory;
  description?: string;
  variant?: "primary" | "secondary" | "warning" | "danger";
  /** Optional argument hint shown to user; if present, button opens a prompt. */
  argHint?: string;
}

export const COMMANDS: CommandSpec[] = [
  // ─── System ──────────────────────────────────────────────────────────────
  { id: "help", label: "Help", command: "help", category: "system", description: "Lists all available commands.", variant: "secondary" },
  { id: "info", label: "Info", command: "info", category: "system", description: "Displays hardware, version, and device MAC address.", variant: "secondary" },
  { id: "reboot", label: "Reboot", command: "reboot", category: "system", description: "Restarts the ESP32 device.", variant: "warning" },
  { id: "settings", label: "Settings", command: "settings", category: "system", description: "Access/Modify tool settings (Stealth, Auto-save, etc.).", variant: "secondary" },
  { id: "update", label: "Update", command: "update", category: "system", description: "Initiates a firmware update (if configured).", variant: "warning" },
  { id: "stopscan", label: "Stop Scan", command: "stopscan", category: "system", description: "Immediately kills any active scan or attack.", variant: "danger" },

  // ─── Wi-Fi Scanning ──────────────────────────────────────────────────────
  { id: "scanap", label: "Scan APs", command: "scanap", category: "wifi_scan", description: "Scans for nearby Access Points (Wi-Fi networks).", variant: "primary" },
  { id: "scansta", label: "Scan Stations", command: "scansta", category: "wifi_scan", description: "Scans for nearby Stations (connected devices).", variant: "primary" },
  { id: "list_a", label: "List APs", command: "list -a", category: "wifi_scan", description: "Lists discovered APs with index IDs.", variant: "secondary" },
  { id: "list_s", label: "List Stations", command: "list -s", category: "wifi_scan", description: "Lists discovered Stations with index IDs.", variant: "secondary" },
  { id: "select_a", label: "Select AP", command: "select -a", category: "wifi_scan", description: "Selects a specific AP for targeting by its list index.", variant: "secondary", argHint: "AP index, e.g. 0" },
  { id: "clearlist", label: "Clear List", command: "clearlist", category: "wifi_scan", description: "Clears all discovered APs, Stations, and SSIDs from memory.", variant: "warning" },
  { id: "channel", label: "Set Channel", command: "channel", category: "wifi_scan", description: "Manually sets the Wi-Fi radio to a specific channel (1-14).", variant: "secondary", argHint: "Channel 1-14" },

  // ─── Sniffing ────────────────────────────────────────────────────────────
  { id: "sniffraw", label: "Sniff Raw", command: "sniffraw", category: "sniffing", description: "Captures all raw Wi-Fi packets on the current channel.", variant: "primary" },
  { id: "sniffbeacon", label: "Sniff Beacon", command: "sniffbeacon", category: "sniffing", description: "Specifically captures and logs beacon frames.", variant: "primary" },
  { id: "sniffdeauth", label: "Sniff Deauth", command: "sniffdeauth", category: "sniffing", description: "Monitors the air for deauthentication packets.", variant: "primary" },
  { id: "sniffpmkid", label: "Sniff PMKID", command: "sniffpmkid", category: "sniffing", description: "Captures PMKIDs for WPA2 password auditing.", variant: "primary" },
  { id: "sniffpwn", label: "Sniff Pwn", command: "sniffpwn", category: "sniffing", description: 'Scans for active "Pwnagotchi" devices.', variant: "primary" },
  { id: "packetcount", label: "Packet Count", command: "packetcount", category: "sniffing", description: "Real-time display of the number of packets per channel.", variant: "secondary" },

  // ─── Wi-Fi Attacks ───────────────────────────────────────────────────────
  { id: "attack_deauth", label: "Deauth Attack", command: "attack -t deauth", category: "wifi_attacks", description: "Sends deauth frames to disconnect devices from an AP.", variant: "danger" },
  { id: "attack_beacon", label: "Beacon Spam", command: "attack -t beacon", category: "wifi_attacks", description: "Spams beacon frames (uses the ssid list).", variant: "danger" },
  { id: "attack_rickroll", label: "Rickroll", command: "attack -t rickroll", category: "wifi_attacks", description: "Spams Wi-Fi names with Rick Astley lyrics.", variant: "warning" },
  { id: "evilportal", label: "Evil Portal", command: "evilportal", category: "wifi_attacks", description: "Launches a Captive Portal to test phishing resilience.", variant: "danger" },
  { id: "karma", label: "Karma", command: "karma", category: "wifi_attacks", description: "Responds to device probe requests (rogue AP attack).", variant: "danger" },

  // ─── Bluetooth / BLE ─────────────────────────────────────────────────────
  { id: "sniffbt", label: "Sniff BT", command: "sniffbt", category: "bluetooth", description: "Scans for nearby Bluetooth/BLE devices.", variant: "primary" },
  { id: "btwardrive", label: "BT Wardrive", command: "btwardrive", category: "bluetooth", description: "Wardrives for Bluetooth devices (requires GPS).", variant: "primary" },
  { id: "sourapple", label: "Sour Apple", command: "sourapple", category: "bluetooth", description: "Sends BLE pairing spam to iOS devices.", variant: "danger" },
  { id: "samsungblespam", label: "Samsung Spam", command: "samsungblespam", category: "bluetooth", description: "Sends BLE pairing spam to Samsung/Android devices.", variant: "danger" },
  { id: "swiftpair", label: "Swift Pair", command: "swiftpair", category: "bluetooth", description: "Sends BLE pairing spam to Windows devices.", variant: "danger" },

  // ─── Data / Storage ──────────────────────────────────────────────────────
  { id: "save", label: "Save", command: "save", category: "storage", description: "Saves current scan/pcap data to the SD card.", variant: "secondary" },
  { id: "load", label: "Load", command: "load", category: "storage", description: "Loads a saved session from the SD card.", variant: "secondary" },
  { id: "ssid_add", label: "Add SSID", command: "ssid -a", category: "storage", description: "Adds a specific SSID name to the attack list.", variant: "secondary", argHint: "SSID name" },

  // ─── GPS & Tracking ──────────────────────────────────────────────────────
  { id: "gpsdata", label: "GPS Data", command: "gpsdata", category: "gps", description: "Shows live GPS coordinates (if GPS module is attached).", variant: "primary" },
  { id: "wardrive", label: "Wardrive", command: "wardrive", category: "gps", description: "Starts Wi-Fi wardriving session (Logs to SD).", variant: "primary" },
  { id: "mactrack", label: "MAC Track", command: "mactrack", category: "gps", description: "Tracks a specific MAC address via signal strength (RSSI).", variant: "secondary", argHint: "Target MAC address" },
];

export function commandsByCategory(): Record<CommandCategory, CommandSpec[]> {
  return COMMANDS.reduce((acc, c) => {
    (acc[c.category] ||= []).push(c);
    return acc;
  }, {} as Record<CommandCategory, CommandSpec[]>);
}
