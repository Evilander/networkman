import { useState } from 'react';
import { OoTFrame } from './OoTFrame';
import { PixelText } from './PixelText';
import styles from './HelpModal.module.css';

interface HelpModalProps {
  onClose: () => void;
}

type HelpTab = 'controls' | 'songs' | 'hud' | 'settings';

const TABS: Array<{ id: HelpTab; label: string }> = [
  { id: 'controls', label: 'Controls' },
  { id: 'songs', label: 'Songs' },
  { id: 'hud', label: 'HUD' },
  { id: 'settings', label: 'Settings' },
];

function GossipStoneIcon() {
  return (
    <svg viewBox="0 0 28 28" width="28" height="28" className={styles.gossipIcon}>
      {/* Stone body */}
      <ellipse cx="14" cy="18" rx="10" ry="9" fill="var(--oot-brown-medium)" />
      <ellipse cx="14" cy="17" rx="9" ry="8" fill="var(--oot-brown-light)" />
      {/* Eye / mystical mark */}
      <ellipse cx="14" cy="14" rx="4" ry="5" fill="none" stroke="var(--oot-gold-medium)" strokeWidth="1.5" />
      <circle cx="14" cy="14" r="2" fill="var(--oot-gold-light)" />
      <circle cx="14" cy="14" r="0.8" fill="var(--oot-bg-darkest)" />
      {/* Top point */}
      <polygon points="14,2 10,10 18,10" fill="var(--oot-brown-light)" />
    </svg>
  );
}

function ControlsContent() {
  return (
    <div className={styles.tabContent}>
      <div className={styles.helpGroup}>
        <PixelText size="xs" color="highlight">Keyboard Shortcuts</PixelText>
        <div className={styles.helpRow}>
          <span className={styles.keyCombo}>
            <span className={styles.key}>Ctrl</span>
            <span className={styles.keyPlus}>+</span>
            <span className={styles.key}>O</span>
          </span>
          <PixelText size="xs" color="secondary">Open Ocarina Console</PixelText>
        </div>
      </div>

      <div className={styles.helpGroup}>
        <PixelText size="xs" color="highlight">Map Navigation</PixelText>
        <div className={styles.helpItem}>
          <PixelText size="xs" color="secondary">
            Click on device markers on the Hyrule Map to view details.
            Selected devices glow and show a tooltip with name, IP,
            hearts, and latency.
          </PixelText>
        </div>
      </div>

      <div className={styles.helpGroup}>
        <PixelText size="xs" color="highlight">Sidebar Tabs</PixelText>
        <div className={styles.helpItem}>
          <PixelText size="xs">Items Tab</PixelText>
          <PixelText size="xs" color="secondary">
            Shows all discovered devices as inventory items.
            Click any device to view its details panel with health,
            network info, and actions.
          </PixelText>
        </div>
        <div className={styles.helpItem}>
          <PixelText size="xs">Navi Tab</PixelText>
          <PixelText size="xs" color="secondary">
            Navi alerts you when devices go offline, come back online,
            or have degraded performance. Alerts appear as fairy-styled
            notifications.
          </PixelText>
        </div>
      </div>

      <div className={styles.helpGroup}>
        <PixelText size="xs" color="highlight">Device Actions</PixelText>
        <div className={styles.helpItem}>
          <PixelText size="xs" color="secondary">
            In the device detail panel, you can Ping Now to test
            connectivity, run a Speed Test to measure latency and
            jitter, or Remove a device from monitoring.
          </PixelText>
        </div>
      </div>
    </div>
  );
}

function SongsContent() {
  const songs = [
    { name: "Zelda's Lullaby", notes: '< ^ > < ^ >', desc: 'Runs a full network scan to discover new devices on your subnet.' },
    { name: "Saria's Song", notes: 'v > < v > <', desc: 'Refreshes all devices from the server, updating the map and sidebar.' },
    { name: 'Song of Storms', notes: 'A v ^ A v ^', desc: 'Clears all active alerts and silences Navi.' },
    { name: 'Song of Time', notes: '> A v > A v', desc: 'Shows a summary of network metrics: device count, avg latency, packet loss.' },
    { name: "Epona's Song", notes: '^ < > ^ < >', desc: 'Exports the entire device list as a downloadable JSON file.' },
    { name: "Sun's Song", notes: '> v ^ > v ^', desc: 'Toggles sound effects on or off.' },
    { name: 'Minuet of Forest', notes: 'A ^ < > < >', desc: 'Shows count of healthy devices (8+ hearts) on the network.' },
    { name: 'Prelude of Light', notes: '^ > ^ > < ^', desc: 'Pings all offline devices to check if they have come back.' },
  ];

  return (
    <div className={styles.tabContent}>
      <div className={styles.helpItem}>
        <PixelText size="xs" color="secondary">
          Open the Ocarina Console with Ctrl+O or the Ocarina button,
          then click a song to play it.
        </PixelText>
      </div>
      <div className={styles.songList}>
        {songs.map((song) => (
          <div key={song.name} className={styles.songEntry}>
            <div className={styles.songHeader}>
              <PixelText size="xs" color="highlight">{song.name}</PixelText>
              <PixelText size="xs" color="secondary">{song.notes}</PixelText>
            </div>
            <PixelText size="xs" color="secondary">{song.desc}</PixelText>
          </div>
        ))}
      </div>
    </div>
  );
}

function HudContent() {
  return (
    <div className={styles.tabContent}>
      <div className={styles.helpGroup}>
        <PixelText size="xs" color="highlight">Hearts</PixelText>
        <div className={styles.helpItem}>
          <PixelText size="xs" color="secondary">
            Each device has up to 10 hearts representing its health.
            Hearts decrease when pings fail or latency is high.
            They regenerate when the device responds reliably.
            Below 3 hearts, they pulse red as a critical warning.
          </PixelText>
        </div>
        <div className={styles.heartLegend}>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: 'var(--oot-green-light)' }} />
            <PixelText size="xs" color="secondary">8-10: Healthy</PixelText>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: 'var(--oot-gold-light)' }} />
            <PixelText size="xs" color="secondary">4-7: Degraded</PixelText>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: 'var(--oot-red-heart)' }} />
            <PixelText size="xs" color="secondary">1-3: Critical</PixelText>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: 'var(--oot-brown-light)' }} />
            <PixelText size="xs" color="secondary">0: Offline</PixelText>
          </div>
        </div>
      </div>

      <div className={styles.helpGroup}>
        <PixelText size="xs" color="highlight">Rupees</PixelText>
        <div className={styles.helpItem}>
          <PixelText size="xs" color="secondary">
            The Rupee counter shows the total number of devices
            being monitored on your network. Green rupees for
            online, blue for all devices total.
          </PixelText>
        </div>
      </div>

      <div className={styles.helpGroup}>
        <PixelText size="xs" color="highlight">Skulltulas</PixelText>
        <div className={styles.helpItem}>
          <PixelText size="xs" color="secondary">
            The Skulltula counter tracks the number of network issues
            and alerts detected. Each unresolved issue counts as a
            Gold Skulltula token. Clear them using Song of Storms.
          </PixelText>
        </div>
      </div>

      <div className={styles.helpGroup}>
        <PixelText size="xs" color="highlight">Device Statuses</PixelText>
        <div className={styles.heartLegend}>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: 'var(--oot-green-light)' }} />
            <PixelText size="xs" color="secondary">Online - responding normally</PixelText>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: 'var(--oot-gold-light)' }} />
            <PixelText size="xs" color="secondary">Degraded - high latency/packet loss</PixelText>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: 'var(--oot-red-heart)' }} />
            <PixelText size="xs" color="secondary">Offline - not responding</PixelText>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: 'var(--oot-brown-light)' }} />
            <PixelText size="xs" color="secondary">Unknown - never been scanned</PixelText>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsContent() {
  return (
    <div className={styles.tabContent}>
      <div className={styles.helpGroup}>
        <PixelText size="xs" color="highlight">Subnet Configuration</PixelText>
        <div className={styles.helpItem}>
          <PixelText size="xs" color="secondary">
            Visit the Settings page to configure which subnet(s)
            NetworkMan scans for devices. The default subnet is
            auto-detected, but you can customize it (e.g., 192.168.1.0/24).
          </PixelText>
        </div>
      </div>

      <div className={styles.helpGroup}>
        <PixelText size="xs" color="highlight">Scan Interval</PixelText>
        <div className={styles.helpItem}>
          <PixelText size="xs" color="secondary">
            Configure how often NetworkMan pings your devices.
            Shorter intervals mean faster detection but more
            network traffic.
          </PixelText>
        </div>
      </div>

      <div className={styles.helpGroup}>
        <PixelText size="xs" color="highlight">Sound Settings</PixelText>
        <div className={styles.helpItem}>
          <PixelText size="xs" color="secondary">
            Toggle OoT sound effects on or off. You can also use
            Sun's Song in the Ocarina Console to toggle sound.
          </PixelText>
        </div>
      </div>

      <div className={styles.helpGroup}>
        <PixelText size="xs" color="highlight">Adding Devices Manually</PixelText>
        <div className={styles.helpItem}>
          <PixelText size="xs" color="secondary">
            You can add devices manually by clicking "Add Device"
            in the sidebar. Enter the IP address, name, and
            optionally a MAC address and hostname.
          </PixelText>
        </div>
      </div>
    </div>
  );
}

export function HelpModal({ onClose }: HelpModalProps) {
  const [activeTab, setActiveTab] = useState<HelpTab>('controls');

  const TabContent = {
    controls: ControlsContent,
    songs: SongsContent,
    hud: HudContent,
    settings: SettingsContent,
  }[activeTab];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <OoTFrame variant="gossip">
          <div className={styles.header}>
            <div className={styles.headerTitle}>
              <GossipStoneIcon />
              <PixelText size="md" color="highlight">Gossip Stone</PixelText>
            </div>
            <button className={styles.closeBtn} onClick={onClose}>
              <PixelText size="xs">X</PixelText>
            </button>
          </div>

          <div className={styles.subtitle}>
            <PixelText size="xs" color="secondary">
              "Heh heh heh... You want to know a secret?
              Let me tell you about this network..."
            </PixelText>
          </div>

          <div className={styles.tabs}>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <PixelText size="xs" color={activeTab === tab.id ? 'highlight' : 'secondary'}>
                  {tab.label}
                </PixelText>
              </button>
            ))}
          </div>

          <div className={styles.contentArea}>
            <TabContent />
          </div>
        </OoTFrame>
      </div>
    </div>
  );
}

export function HelpButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      className={styles.helpBtn}
      onClick={onClick}
      title="Help & Tips (Gossip Stone)"
    >
      <GossipStoneIcon />
      <PixelText size="xs" color="secondary">Help</PixelText>
    </button>
  );
}
