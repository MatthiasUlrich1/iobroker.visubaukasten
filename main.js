'use strict';

const utils = require('@iobroker/adapter-core'); // Adapter-Baseclass
const { exec } = require('child_process');

// Adapter-Abhängigkeiten und Mindestversionen
const requiredAdapters = {
    "javascript": "9.0.7",
    "web": "7.0.8",
    "vis": "1.5.6",
    "trashschedule": "3.3.0",
    "ical": "1.16.6",
    "alias-manager": "2.0.0",
    "vis-jqui-mfd": "1.0.12",
    "vis-materialdesign": "1.7.2",
    "vis-timeandweather": "1.2.2"
};

// Versionsvergleich (true, wenn v1 >= v2)
function compareVersions(v1, v2) {
    const a = v1.split('.').map(Number);
    const b = v2.split('.').map(Number);
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
        const n1 = a[i] || 0;
        const n2 = b[i] || 0;
        if (n1 > n2) return true;
        if (n1 < n2) return false;
    }
    return true;
}

class Visubaukasten extends utils.Adapter {
    constructor(options) {
        super({
            ...options,
            name: 'visubaukasten',
        });

        this.on('ready', this.onReady.bind(this));
        this.on('unload', this.onUnload.bind(this));
    }

    async onReady() {
        this.log.info('Adapter visubaukasten gestartet.');

        // Optional: Adapter-Option für automatische Installation
        const autoInstall = this.config.autoInstallDependencies || false;

        for (const [adapter, minVersion] of Object.entries(requiredAdapters)) {
            try {
                const obj = await this.getForeignObjectAsync('system.adapter.' + adapter + '.0');
                if (!obj) {
                    this.log.warn(`Adapter "${adapter}" ist NICHT installiert! Benötigt wird mindestens Version ${minVersion}.`);
                    if (autoInstall) {
                        this.installAdapter(adapter, minVersion);
                    }
                } else {
                    const currentVersion = obj.common.version;
                    if (!compareVersions(currentVersion, minVersion)) {
                        this.log.warn(`Adapter "${adapter}" ist in Version ${currentVersion} installiert, benötigt wird mindestens ${minVersion}.`);
                        if (autoInstall) {
                            this.upgradeAdapter(adapter, minVersion);
                        }
                    } else {
                        this.log.info(`Adapter "${adapter}" ist in ausreichender Version (${currentVersion}) installiert.`);
                    }
                }
            } catch (e) {
                this.log.error(`Fehler beim Prüfen von "${adapter}": ${e.message}`);
            }
        }

        // Hier dein eigentlicher Adapter-Code...
    }

    installAdapter(adapter, version) {
        this.log.info(`Starte Installation von ${adapter}@${version} ...`);
        exec(`iobroker add ${adapter}@${version} --log-level warn`, (error, stdout, stderr) => {
            if (error) {
                this.log.error(`Fehler bei Installation von ${adapter}: ${error.message}`);
            } else {
                this.log.info(`Adapter ${adapter} wurde installiert.`);
            }
        });
    }

    upgradeAdapter(adapter, version) {
        this.log.info(`Starte Upgrade von ${adapter}@${version} ...`);
        exec(`iobroker upgrade ${adapter}@${version} --log-level warn`, (error, stdout, stderr) => {
            if (error) {
                this.log.error(`Fehler bei Upgrade von ${adapter}: ${error.message}`);
            } else {
                this.log.info(`Adapter ${adapter} wurde aktualisiert.`);
            }
        });
    }

    onUnload(callback) {
        try {
            this.log.info('Adapter visubaukasten gestoppt.');
            callback();
        } catch (e) {
            callback();
        }
    }
}

if (module.parent) {
    module.exports = (options) => new Visubaukasten(options);
} else {
    new Visubaukasten();
}
