// ===========================================
// BACKUP & RESTORE SYSTEM
// ===========================================

class BackupSystem {
    constructor() {
        this.backupKey = '2dBackupData';
        this.backupHistoryKey = '2dBackupHistory';
        this.backupSettingsKey = '2dBackupSettings';
        
        this.settings = this.loadSettings();
        this.backupHistory = this.loadBackupHistory();
        
        this.init();
    }
    
    // Initialize backup system
    init() {
        // Load and display stats
        this.updateBackupStats();
        this.updateBackupList();
        this.loadSettingsUI();
        
        // Setup auto-backup if enabled
        if (this.settings.autoBackupEnabled) {
            this.setupAutoBackup();
        }
        
        // Check if backup is due
        this.checkAutoBackup();
        
        // Setup periodic checks
        setInterval(() => this.checkAutoBackup(), 5 * 60 * 1000); // Check every 5 minutes
    }
    
    // Load settings from localStorage
    loadSettings() {
        const defaultSettings = {
            autoBackupEnabled: false,
            backupFrequency: 'daily', // daily, weekly, monthly
            maxBackups: 10,
            lastAutoBackup: null,
            emailBackup: false,
            emailAddress: '',
            notifyOnBackup: true
        };
        
        const stored = localStorage.getItem(this.backupSettingsKey);
        return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
    }
    
    // Save settings to localStorage
    saveSettings() {
        localStorage.setItem(this.backupSettingsKey, JSON.stringify(this.settings));
        this.updateBackupStats();
    }
    
    // Load backup history
    loadBackupHistory() {
        const stored = localStorage.getItem(this.backupHistoryKey);
        return stored ? JSON.parse(stored) : [];
    }
    
    // Save backup history
    saveBackupHistory() {
        // Sort by date (newest first)
        this.backupHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Keep only max backups
        if (this.backupHistory.length > this.settings.maxBackups) {
            this.backupHistory = this.backupHistory.slice(0, this.settings.maxBackups);
        }
        
        localStorage.setItem(this.backupHistoryKey, JSON.stringify(this.backupHistory));
        this.updateBackupList();
    }
    
    // Load settings into UI
    loadSettingsUI() {
        const autoBackupToggle = document.getElementById('autoBackupToggle');
        const backupFrequency = document.getElementById('backupFrequency');
        const maxBackups = document.getElementById('maxBackups');
        
        if (autoBackupToggle) autoBackupToggle.checked = this.settings.autoBackupEnabled;
        if (backupFrequency) backupFrequency.value = this.settings.backupFrequency;
        if (maxBackups) maxBackups.value = this.settings.maxBackups;
    }
    
    // Toggle auto-backup
    toggleAutoBackup() {
        const toggle = document.getElementById('autoBackupToggle');
        if (!toggle) return;
        
        this.settings.autoBackupEnabled = toggle.checked;
        this.saveSettings();
        
        if (this.settings.autoBackupEnabled) {
            this.setupAutoBackup();
            this.showStatus('✅ Auto-backup enabled', 'success');
        } else {
            this.showStatus('Auto-backup disabled', 'info');
        }
    }
    
    // Update backup frequency
    updateBackupFrequency() {
        const frequency = document.getElementById('backupFrequency');
        if (!frequency) return;
        
        this.settings.backupFrequency = frequency.value;
        this.saveSettings();
        this.setupAutoBackup();
    }
    
    // Setup auto-backup timer
    setupAutoBackup() {
        if (!this.settings.autoBackupEnabled) return;
        
        // Calculate next backup time based on frequency
        const now = new Date();
        let nextBackup = new Date(now);
        
        switch (this.settings.backupFrequency) {
            case 'daily':
                nextBackup.setDate(nextBackup.getDate() + 1);
                nextBackup.setHours(2, 0, 0, 0); // 2 AM
                break;
            case 'weekly':
                nextBackup.setDate(nextBackup.getDate() + 7);
                nextBackup.setHours(2, 0, 0, 0);
                break;
            case 'monthly':
                nextBackup.setMonth(nextBackup.getMonth() + 1);
                nextBackup.setHours(2, 0, 0, 0);
                break;
        }
        
        console.log(`Next auto-backup scheduled for: ${nextBackup.toLocaleString()}`);
    }
    
    // Check if auto-backup is due
    checkAutoBackup() {
        if (!this.settings.autoBackupEnabled || !this.settings.lastAutoBackup) return;
        
        const now = new Date();
        const lastBackup = new Date(this.settings.lastAutoBackup);
        const hoursSinceBackup = (now - lastBackup) / (1000 * 60 * 60);
        
        let backupDue = false;
        
        switch (this.settings.backupFrequency) {
            case 'daily':
                backupDue = hoursSinceBackup >= 24;
                break;
            case 'weekly':
                backupDue = hoursSinceBackup >= 168; // 7 days
                break;
            case 'monthly':
                backupDue = hoursSinceBackup >= 720; // 30 days
                break;
        }
        
        if (backupDue) {
            this.createAutoBackup();
        }
    }
    
    // Create a backup
    createBackup(type = 'manual') {
        try {
            const backupData = this.collectAllData();
            const backup = {
                id: this.generateBackupId(),
                timestamp: new Date().toISOString(),
                type: type,
                data: backupData,
                size: this.calculateDataSize(backupData),
                version: '1.0'
            };
            
            // Add to history
            this.backupHistory.unshift(backup);
            this.saveBackupHistory();
            
            // Update last backup time if auto-backup
            if (type === 'auto') {
                this.settings.lastAutoBackup = backup.timestamp;
                this.saveSettings();
            }
            
            // Update stats
            this.updateBackupStats();
            
            // Show success
            this.showStatus(`✅ Backup created successfully! (${backup.size})`, 'success');
            
            // Send notification
            if (typeof notificationSystem !== 'undefined') {
                notificationSystem.addNotification(
                    'Backup Created',
                    `New ${type} backup created. Size: ${backup.size}`,
                    'system'
                );
            }
            
            return backup;
            
        } catch (error) {
            console.error('Error creating backup:', error);
            this.showStatus('❌ Error creating backup', 'error');
            return null;
        }
    }
    
    // Create auto-backup
    createAutoBackup() {
        const backup = this.createBackup('auto');
        if (backup && this.settings.notifyOnBackup) {
            console.log('Auto-backup created:', backup.timestamp);
        }
    }
    
    // Force auto-backup now
    forceAutoBackup() {
        this.createAutoBackup();
        this.showStatus('Auto-backup executed', 'success');
    }
    
    // Collect all data from localStorage
    collectAllData() {
        const data = {};
        
        // Collect all known keys
        const knownKeys = [
            '2dNumbers',
            '2dCurrentNumbers',
            '2dClosingConfig',
            'paymentVerifications',
            '2dAnalyticsData',
            '2dUserData',
            '2dPurchaseHistory',
            '2dUserSettings',
            '2dNotifications',
            '2dNotificationSettings',
            '2dShareStats',
            '2dRecentShares',
            'adminNotifications'
        ];
        
        knownKeys.forEach(key => {
            const value = localStorage.getItem(key);
            if (value) {
                data[key] = JSON.parse(value);
            }
        });
        
        // Also collect any other keys that might exist
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!knownKeys.includes(key) && key.startsWith('2d')) {
                try {
                    data[key] = JSON.parse(localStorage.getItem(key));
                } catch {
                    data[key] = localStorage.getItem(key);
                }
            }
        }
        
        // Add metadata
        data._metadata = {
            backupDate: new Date().toISOString(),
            totalKeys: Object.keys(data).length,
            appVersion: '2d-plus-1.0'
        };
        
        return data;
    }
    
    // Generate backup ID
    generateBackupId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 9);
        return `backup_${timestamp}_${random}`.toUpperCase();
    }
    
    // Calculate data size
    calculateDataSize(data) {
        const jsonString = JSON.stringify(data);
        const bytes = new TextEncoder().encode(jsonString).length;
        
        if (bytes < 1024) {
            return `${bytes} B`;
        } else if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(1)} KB`;
        } else {
            return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
        }
    }
    
    // Update backup stats display
    updateBackupStats() {
        const backupCount = document.getElementById('backupCount');
        const lastBackupTime = document.getElementById('lastBackupTime');
        const totalDataSize = document.getElementById('totalDataSize');
        const autoBackupStatus = document.getElementById('autoBackupStatus');
        
        if (backupCount) backupCount.textContent = this.backupHistory.length;
        
        if (lastBackupTime) {
            if (this.backupHistory.length > 0) {
                const latest = this.backupHistory[0];
                const time = new Date(latest.timestamp);
                lastBackupTime.textContent = time.toLocaleDateString();
                lastBackupTime.title = time.toLocaleString();
            } else {
                lastBackupTime.textContent = 'Never';
            }
        }
        
        if (totalDataSize) {
            let totalBytes = 0;
            this.backupHistory.forEach(backup => {
                const jsonString = JSON.stringify(backup.data);
                totalBytes += new TextEncoder().encode(jsonString).length;
            });
            
            if (totalBytes < 1024) {
                totalDataSize.textContent = `${totalBytes} B`;
            } else if (totalBytes < 1024 * 1024) {
                totalDataSize.textContent = `${(totalBytes / 1024).toFixed(1)} KB`;
            } else {
                totalDataSize.textContent = `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`;
            }
        }
        
        if (autoBackupStatus) {
            autoBackupStatus.textContent = this.settings.autoBackupEnabled ? 'ON' : 'OFF';
            autoBackupStatus.style.color = this.settings.autoBackupEnabled ? '#4CAF50' : '#ff6b6b';
        }
    }
    
    // Update backup list display
    updateBackupList() {
        const container = document.getElementById('backupList');
        if (!container) return;
        
        if (this.backupHistory.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #aaa;">
                    <i class="fas fa-database" style="font-size: 48px; margin-bottom: 15px; opacity: 0.5;"></i>
                    <p>No backups yet</p>
                    <p style="font-size: 14px; color: #777;">Create your first backup to protect your data</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.backupHistory.map((backup, index) => `
            <div class="backup-item" style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 10px; margin-bottom: 10px; border-left: 4px solid ${backup.type === 'auto' ? '#4CAF50' : '#00d4ff'};">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-database" style="color: ${backup.type === 'auto' ? '#4CAF50' : '#00d4ff'}"></i>
                        <strong style="color: white;">Backup #${this.backupHistory.length - index}</strong>
                        <span style="background: ${backup.type === 'auto' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(0, 212, 255, 0.2)'}; color: ${backup.type === 'auto' ? '#4CAF50' : '#00d4ff'}; padding: 2px 8px; border-radius: 10px; font-size: 12px;">
                            ${backup.type.toUpperCase()}
                        </span>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button onclick="backupSystem.restoreBackup('${backup.id}')" style="background: rgba(0, 212, 255, 0.2); color: #00d4ff; border: 1px solid #00d4ff; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 12px;">
                            <i class="fas fa-undo"></i> Restore
                        </button>
                        <button onclick="backupSystem.downloadBackup('${backup.id}')" style="background: rgba(76, 175, 80, 0.2); color: #4CAF50; border: 1px solid #4CAF50; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 12px;">
                            <i class="fas fa-download"></i> Export
                        </button>
                        <button onclick="backupSystem.deleteBackup('${backup.id}')" style="background: rgba(255, 107, 107, 0.2); color: #ff6b6b; border: 1px solid #ff6b6b; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 12px;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; font-size: 14px;">
                    <div>
                        <span style="color: #aaa;">Date:</span><br>
                        <strong style="color: white;">${new Date(backup.timestamp).toLocaleDateString()}</strong>
                    </div>
                    <div>
                        <span style="color: #aaa;">Time:</span><br>
                        <strong style="color: white;">${new Date(backup.timestamp).toLocaleTimeString()}</strong>
                    </div>
                    <div>
                        <span style="color: #aaa;">Size:</span><br>
                        <strong style="color: white;">${backup.size}</strong>
                    </div>
                    <div>
                        <span style="color: #aaa;">Keys:</span><br>
                        <strong style="color: white;">${Object.keys(backup.data).length}</strong>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    // Restore from backup file
    restoreFromFile(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (!confirm('⚠️ RESTORE BACKUP?\n\nThis will overwrite ALL current data with the backup data. This action cannot be undone.')) {
            event.target.value = '';
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const backupData = JSON.parse(e.target.result);
                this.restoreData(backupData);
                event.target.value = '';
            } catch (error) {
                console.error('Error parsing backup file:', error);
                this.showStatus('❌ Invalid backup file format', 'error');
                event.target.value = '';
            }
        };
        
        reader.readAsText(file);
    }
    
    // Restore specific backup
    restoreBackup(backupId) {
        const backup = this.backupHistory.find(b => b.id === backupId);
        if (!backup) return;
        
        if (!confirm(`Restore backup from ${new Date(backup.timestamp).toLocaleString()}?`)) {
            return;
        }
        
        this.restoreData(backup.data);
    }
    
    // Restore latest backup
    restoreLatestBackup() {
        if (this.backupHistory.length === 0) {
            this.showStatus('No backups available to restore', 'error');
            return;
        }
        
        const latest = this.backupHistory[0];
        if (!confirm(`Restore latest backup from ${new Date(latest.timestamp).toLocaleString()}?`)) {
            return;
        }
        
        this.restoreData(latest.data);
    }
    
    // Restore data to localStorage
    restoreData(backupData) {
        try {
            // Clear current data
            this.clearAllLocalStorage();
            
            // Restore each key
            Object.keys(backupData).forEach(key => {
                if (key !== '_metadata') {
                    try {
                        localStorage.setItem(key, JSON.stringify(backupData[key]));
                    } catch (error) {
                        console.error(`Error restoring key ${key}:`, error);
                    }
                }
            });
            
            // Show success
            this.showStatus('✅ Backup restored successfully! Please refresh the page.', 'success');
            
            // Send notification
            if (typeof notificationSystem !== 'undefined') {
                notificationSystem.addNotification(
                    'Backup Restored',
                    'All data has been restored from backup. Page will refresh.',
                    'system'
                );
            }
            
            // Refresh page after 3 seconds
            setTimeout(() => {
                if (confirm('Backup restored successfully! Refresh the page to see restored data?')) {
                    window.location.reload();
                }
            }, 3000);
            
        } catch (error) {
            console.error('Error restoring backup:', error);
            this.showStatus('❌ Error restoring backup', 'error');
        }
    }
    
    // Clear all localStorage (careful!)
    clearAllLocalStorage() {
        // Create a list of keys to preserve
        const preserveKeys = ['2dBackupData', '2dBackupHistory', '2dBackupSettings'];
        
        // Get all keys
        const allKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
            allKeys.push(localStorage.key(i));
        }
        
        // Remove keys not in preserve list
        allKeys.forEach(key => {
            if (!preserveKeys.includes(key)) {
                localStorage.removeItem(key);
            }
        });
    }
    
    // Download specific backup
    downloadBackup(backupId) {
        const backup = this.backupHistory.find(b => b.id === backupId);
        if (!backup) return;
        
        const dataStr = JSON.stringify(backup.data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const fileName = `2d-backup-${backupId}-${new Date(backup.timestamp).toISOString().split('T')[0]}.json`;
        
        const link = document.createElement('a');
        link.setAttribute('href', dataUri);
        link.setAttribute('download', fileName);
        link.click();
        
        this.showStatus('Backup downloaded', 'success');
    }
    
    // Export all data (current state)
    exportAllData() {
        const currentData = this.collectAllData();
        const dataStr = JSON.stringify(currentData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const fileName = `2d-full-export-${new Date().toISOString().split('T')[0]}.json`;
        
        const link = document.createElement('a');
        link.setAttribute('href', dataUri);
        link.setAttribute('download', fileName);
        link.click();
        
        this.showStatus('All data exported', 'success');
    }
    
    // Export for migration (minimal data)
    exportForMigration() {
        const migrationData = {
            numbers: JSON.parse(localStorage.getItem('2dNumbers') || '{}'),
            closingConfig: JSON.parse(localStorage.getItem('2dClosingConfig') || '{}'),
            verifications: JSON.parse(localStorage.getItem('paymentVerifications') || '[]'),
            exportDate: new Date().toISOString(),
            type: 'migration'
        };
        
        const dataStr = JSON.stringify(migrationData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const fileName = `2d-migration-${new Date().toISOString().split('T')[0]}.json`;
        
        const link = document.createElement('a');
        link.setAttribute('href', dataUri);
        link.setAttribute('download', fileName);
        link.click();
        
        this.showStatus('Migration data exported', 'success');
    }
    
    // Delete specific backup
    deleteBackup(backupId) {
        if (!confirm('Delete this backup?')) return;
        
        const index = this.backupHistory.findIndex(b => b.id === backupId);
        if (index !== -1) {
            this.backupHistory.splice(index, 1);
            this.saveBackupHistory();
            this.updateBackupStats();
            this.showStatus('Backup deleted', 'success');
        }
    }
    
    // Clear old backups
    clearOldBackups() {
        if (this.backupHistory.length <= 1) {
            this.showStatus('No old backups to clear', 'info');
            return;
        }
        
        const keepCount = parseInt(document.getElementById('maxBackups')?.value || 10);
        
        if (this.backupHistory.length <= keepCount) {
            this.showStatus(`Already have ${this.backupHistory.length} backups (max: ${keepCount})`, 'info');
            return;
        }
        
        if (!confirm(`Delete all but the latest ${keepCount} backups?`)) return;
        
        this.backupHistory = this.backupHistory.slice(0, keepCount);
        this.saveBackupHistory();
        this.updateBackupStats();
        
        this.showStatus(`Cleared old backups, kept ${keepCount}`, 'success');
    }
    
    // Reset all data (emergency)
    resetAllData() {
        if (!confirm('⚠️ DANGER: This will DELETE ALL DATA including backups, users, purchases, etc. This cannot be undone!\n\nType "RESET" to confirm.')) {
            return;
        }
        
        const confirmation = prompt('Type "RESET" to confirm:');
        if (confirmation !== 'RESET') {
            alert('Cancelled. No data was deleted.');
            return;
        }
        
        // Clear everything
        localStorage.clear();
        
        // Show message
        this.showStatus('ALL DATA RESET. Page will refresh.', 'error');
        
        // Refresh page
        setTimeout(() => {
            alert('All data has been reset. The page will now refresh.');
            window.location.reload();
        }, 2000);
    }
    
    // Backup to email (simulated)
    backupToEmail() {
        const email = prompt('Enter email address to send backup:');
        if (!email) return;
        
        // In a real implementation, this would use a server API
        // For now, we'll simulate it
        
        this.showStatus('Simulating email backup...', 'info');
        
        setTimeout(() => {
            // Create a backup
            const backup = this.createBackup('email');
            
            // Simulate sending email
            this.showStatus(`✅ Backup sent to ${email}`, 'success');
            
            // Store email setting
            this.settings.emailAddress = email;
            this.settings.emailBackup = true;
            this.saveSettings();
            
            console.log(`Backup would be sent to: ${email}`);
            console.log('Backup data:', backup);
        }, 1500);
    }
    
    // Show status message
    showStatus(message, type) {
        const statusElement = document.getElementById('backupStatus');
        if (!statusElement) return;
        
        statusElement.textContent = message;
        statusElement.className = '';
        statusElement.classList.add('status-message');
        
        if (type === 'success') {
            statusElement.style.background = 'rgba(76, 175, 80, 0.2)';
            statusElement.style.color = '#4CAF50';
            statusElement.style.border = '1px solid #4CAF50';
        } else if (type === 'error') {
            statusElement.style.background = 'rgba(244, 67, 54, 0.2)';
            statusElement.style.color = '#f44336';
            statusElement.style.border = '1px solid #f44336';
        } else if (type === 'info') {
            statusElement.style.background = 'rgba(0, 212, 255, 0.2)';
            statusElement.style.color = '#00d4ff';
            statusElement.style.border = '1px solid #00d4ff';
        }
        
        statusElement.style.display = 'block';
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            statusElement.style.display = 'none';
        }, 5000);
    }
}

// Global backup system instance
let backupSystem;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    backupSystem = new BackupSystem();
});