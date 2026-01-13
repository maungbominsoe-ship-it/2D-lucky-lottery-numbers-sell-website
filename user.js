// ===========================================
// BASIC USER ACCOUNTS SYSTEM
// ===========================================

// User Data Storage Keys
const USER_DATA_KEY = '2dUserData';
const PURCHASE_HISTORY_KEY = '2dPurchaseHistory';
const USER_SETTINGS_KEY = '2dUserSettings';

// User System Class
class UserSystem {
    constructor() {
        this.userData = this.loadUserData();
        this.purchaseHistory = this.loadPurchaseHistory();
        this.settings = this.loadSettings();
        this.currentUser = null;
        
        this.init();
    }
    
    // Initialize user system
    init() {
        // Ensure user data exists
        if (!this.userData.userId) {
            this.createNewUser();
        }
        
        this.currentUser = this.userData;
        
        // Update UI
        this.updateUserProfile();
        this.loadPurchaseHistoryUI();
        
        // Setup auto-save
        this.setupAutoSave();
        
        // Listen for purchases
        this.listenForPurchases();
        
        // Track user activity
        this.trackActivity('System initialized');
    }
    
    // Create new user
    createNewUser() {
        const userId = this.generateUserId();
        const userColor = this.getRandomColor();
        
        this.userData = {
            userId: userId,
            displayName: `User_${userId.substr(0, 6)}`,
            createdAt: new Date().toISOString(),
            lastActive: new Date().toISOString(),
            avatarColor: userColor,
            totalPurchases: 0,
            totalSpent: 0,
            favoritePackage: null,
            preferences: {
                autoSave: true,
                rememberPayment: true,
                showHistory: true,
                clearOnClose: false
            }
        };
        
        this.saveUserData();
        this.trackActivity('New user created');
        
        // Show welcome notification
        if (typeof notificationSystem !== 'undefined') {
            notificationSystem.addNotification(
                'Welcome to 2D Plus!',
                'Your user profile has been created. Click the user icon to manage your account.',
                'system'
            );
        }
    }
    
    // Generate unique user ID
    generateUserId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 9);
        return `2D_${timestamp}_${random}`.toUpperCase();
    }
    
    // Get random color for avatar
    getRandomColor() {
        const colors = ['#00d4ff', '#4CAF50', '#ff6b6b', '#ffc107', '#9c27b0', '#2196F3', '#FF9800'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    // Load user data from localStorage
    loadUserData() {
        const stored = localStorage.getItem(USER_DATA_KEY);
        return stored ? JSON.parse(stored) : {};
    }
    
    // Save user data to localStorage
    saveUserData() {
        this.userData.lastActive = new Date().toISOString();
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(this.userData));
    }
    
    // Load purchase history
    loadPurchaseHistory() {
        const stored = localStorage.getItem(PURCHASE_HISTORY_KEY);
        return stored ? JSON.parse(stored) : [];
    }
    
    // Save purchase history
    savePurchaseHistory() {
        localStorage.setItem(PURCHASE_HISTORY_KEY, JSON.stringify(this.purchaseHistory));
    }
    
    // Load user settings
    loadSettings() {
        const defaultSettings = {
            autoSave: true,
            rememberPayment: true,
            showHistory: true,
            clearOnClose: false,
            notificationSound: true,
            notificationNumbers: true,
            notificationSessions: true,
            notificationPayments: true
        };
        
        const stored = localStorage.getItem(USER_SETTINGS_KEY);
        return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
    }
    
    // Save user settings
    saveSettings() {
        localStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(this.settings));
    }
    
    // Update user profile UI
    updateUserProfile() {
        // Update avatar
        const avatar = document.getElementById('userAvatar');
        const avatarText = document.getElementById('avatarText');
        
        if (avatar && this.userData.avatarColor) {
            avatar.style.background = this.userData.avatarColor;
        }
        
        if (avatarText && this.userData.displayName) {
            avatarText.textContent = this.userData.displayName.charAt(0).toUpperCase();
        }
        
        // Update user info
        const userName = document.getElementById('userName');
        const userId = document.getElementById('userId');
        const purchaseCount = document.getElementById('purchaseCount');
        const totalSpent = document.getElementById('totalSpent');
        
        if (userName) userName.textContent = this.userData.displayName || 'Guest User';
        if (userId) userId.textContent = `ID: ${this.userData.userId || 'Unknown'}`;
        if (purchaseCount) purchaseCount.textContent = this.userData.totalPurchases || 0;
        if (totalSpent) totalSpent.textContent = (this.userData.totalSpent || 0).toLocaleString();
        
        // Update quick stats
        this.updateQuickStats();
        
        // Load settings into UI
        this.loadSettingsUI();
    }
    
    // Update quick stats
    updateQuickStats() {
        const approved = document.getElementById('approvedPurchases');
        const pending = document.getElementById('pendingPurchases');
        const favorite = document.getElementById('favoritePackage');
        
        if (approved) {
            const approvedCount = this.purchaseHistory.filter(p => p.status === 'approved').length;
            approved.textContent = approvedCount;
        }
        
        if (pending) {
            const pendingCount = this.purchaseHistory.filter(p => p.status === 'pending').length;
            pending.textContent = pendingCount;
        }
        
        if (favorite) {
            favorite.textContent = this.userData.favoritePackage || 'None';
        }
    }
    
    // Load purchase history UI
    loadPurchaseHistoryUI(filter = 'all') {
        const container = document.getElementById('purchaseHistoryList');
        if (!container) return;
        
        let filteredHistory = this.purchaseHistory;
        
        if (filter !== 'all') {
            filteredHistory = this.purchaseHistory.filter(p => p.status === filter);
        }
        
        if (filteredHistory.length === 0) {
            container.innerHTML = `
                <div class="empty-history">
                    <i class="fas fa-shopping-cart"></i>
                    <p>No purchase history yet</p>
                    <p class="subtext">Your purchases will appear here</p>
                </div>
            `;
            return;
        }
        
        // Sort by date (newest first)
        const sortedHistory = filteredHistory.sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
        );
        
        container.innerHTML = sortedHistory.map(purchase => `
            <div class="purchase-item ${purchase.status}">
                <div class="purchase-header">
                    <div class="purchase-title">${purchase.packages?.join(' + ') || 'Unknown Package'}</div>
                    <div class="purchase-status status-${purchase.status}">
                        ${purchase.status.toUpperCase()}
                    </div>
                </div>
                <div class="purchase-details">
                    <div class="detail-item">
                        <span>Amount</span>
                        <strong>${purchase.amount?.toLocaleString() || '0'} Ks</strong>
                    </div>
                    <div class="detail-item">
                        <span>Method</span>
                        <strong>${purchase.paymentMethod?.toUpperCase() || 'Unknown'}</strong>
                    </div>
                    <div class="detail-item">
                        <span>Transaction</span>
                        <strong>${purchase.transactionId?.substr(0, 12) || 'N/A'}</strong>
                    </div>
                    <div class="detail-item">
                        <span>Date</span>
                        <strong>${new Date(purchase.timestamp).toLocaleDateString()}</strong>
                    </div>
                </div>
                ${purchase.status === 'rejected' && purchase.rejectionReason ? `
                <div class="rejection-reason">
                    <strong>Reason:</strong> ${purchase.rejectionReason}
                </div>
                ` : ''}
            </div>
        `).join('');
    }
    
    // Load settings into UI
    loadSettingsUI() {
        const autoSave = document.getElementById('autoSaveSelections');
        const rememberPayment = document.getElementById('rememberPaymentInfo');
        const showHistory = document.getElementById('showPurchaseHistory');
        const clearOnClose = document.getElementById('clearOnClose');
        const displayName = document.getElementById('displayNameInput');
        
        if (autoSave) autoSave.checked = this.settings.autoSave;
        if (rememberPayment) rememberPayment.checked = this.settings.rememberPayment;
        if (showHistory) showHistory.checked = this.settings.showHistory;
        if (clearOnClose) clearOnClose.checked = this.settings.clearOnClose;
        if (displayName) displayName.value = this.userData.displayName || '';
        
        // Add change listeners
        [autoSave, rememberPayment, showHistory, clearOnClose].forEach(input => {
            if (input) {
                input.addEventListener('change', (e) => {
                    this.settings[e.target.id] = e.target.checked;
                    this.saveSettings();
                });
            }
        });
    }
    
    // Update display name
    updateDisplayName() {
        const input = document.getElementById('displayNameInput');
        if (!input || !input.value.trim()) return;
        
        this.userData.displayName = input.value.trim();
        this.saveUserData();
        this.updateUserProfile();
        
        this.trackActivity('Updated display name');
        
        // Show success
        alert('Display name updated!');
    }
    
    // Set avatar color
    setAvatarColor(color) {
        this.userData.avatarColor = color;
        this.saveUserData();
        this.updateUserProfile();
        
        this.trackActivity('Changed avatar color');
    }
    
    // Setup auto-save for package selections
    setupAutoSave() {
        if (!this.settings.autoSave) return;
        
        // Save package selections when they change
        window.addEventListener('packageSelectionChanged', (e) => {
            this.savePackageSelections(e.detail);
        });
        
        // Load saved selections on page load
        this.loadPackageSelections();
    }
    
    // Save package selections
    savePackageSelections(selections) {
        if (!this.settings.autoSave) return;
        
        this.userData.lastSelections = selections;
        this.saveUserData();
    }
    
    // Load saved package selections
    loadPackageSelections() {
        if (!this.settings.autoSave || !this.userData.lastSelections) return;
        
        // In a real implementation, this would restore the selections
        // For now, we just track that we loaded them
        this.trackActivity('Loaded saved package selections');
    }
    
    // Listen for purchases
    listenForPurchases() {
        // Listen for payment verifications
        window.addEventListener('storage', (e) => {
            if (e.key === 'paymentVerifications') {
                this.updatePurchaseHistory();
            }
        });
        
        // Also check on initialization
        this.updatePurchaseHistory();
    }
    
    // Update purchase history from verifications
    updatePurchaseHistory() {
        const verifications = JSON.parse(localStorage.getItem('paymentVerifications') || '[]');
        
        // Add new verifications to history
        verifications.forEach(verification => {
            // Check if already in history
            const existing = this.purchaseHistory.find(p => p.verificationId === verification.id);
            
            if (!existing) {
                const purchase = {
                    id: Date.now() + Math.random().toString(36).substr(2, 9),
                    verificationId: verification.id,
                    packages: verification.packages?.map(p => p.name) || [],
                    amount: verification.totalAmount || 0,
                    paymentMethod: verification.paymentMethod,
                    transactionId: verification.transactionId,
                    status: verification.status || 'pending',
                    timestamp: verification.timestamp,
                    rejectionReason: verification.rejectionReason
                };
                
                this.purchaseHistory.push(purchase);
                
                // Update user stats
                if (verification.status === 'approved') {
                    this.userData.totalPurchases = (this.userData.totalPurchases || 0) + 1;
                    this.userData.totalSpent = (this.userData.totalSpent || 0) + (verification.totalAmount || 0);
                    
                    // Update favorite package
                    this.updateFavoritePackage(verification.packages);
                }
                
                this.trackActivity(`New purchase: ${purchase.packages.join(' + ')}`);
            } else if (existing.status !== verification.status) {
                // Update status
                existing.status = verification.status;
                existing.updatedAt = new Date().toISOString();
                
                if (verification.status === 'approved') {
                    this.userData.totalPurchases = (this.userData.totalPurchases || 0) + 1;
                    this.userData.totalSpent = (this.userData.totalSpent || 0) + (verification.totalAmount || 0);
                }
                
                this.trackActivity(`Purchase status updated: ${verification.status}`);
            }
        });
        
        // Save updates
        this.savePurchaseHistory();
        this.saveUserData();
        
        // Update UI
        this.updateUserProfile();
        
        // Update history list if visible
        if (document.getElementById('purchaseHistoryList')) {
            const activeFilter = document.querySelector('.filter-btn.active')?.textContent?.toLowerCase() || 'all';
            this.loadPurchaseHistoryUI(activeFilter);
        }
    }
    
    // Update favorite package
    updateFavoritePackage(packages) {
        if (!packages || packages.length === 0) return;
        
        // Count package occurrences
        const packageCount = {};
        this.purchaseHistory.forEach(purchase => {
            purchase.packages?.forEach(pkg => {
                packageCount[pkg] = (packageCount[pkg] || 0) + 1;
            });
        });
        
        // Find most frequent package
        let favorite = null;
        let maxCount = 0;
        
        for (const [pkg, count] of Object.entries(packageCount)) {
            if (count > maxCount) {
                maxCount = count;
                favorite = pkg;
            }
        }
        
        if (favorite) {
            this.userData.favoritePackage = favorite;
            this.saveUserData();
        }
    }
    
    // Track user activity
    trackActivity(description) {
        if (!this.userData.activities) {
            this.userData.activities = [];
        }
        
        const activity = {
            id: Date.now(),
            description,
            timestamp: new Date().toISOString()
        };
        
        // Add to beginning of array
        this.userData.activities.unshift(activity);
        
        // Keep only last 50 activities
        if (this.userData.activities.length > 50) {
            this.userData.activities = this.userData.activities.slice(0, 50);
        }
        
        this.saveUserData();
        this.updateRecentActivityUI();
    }
    
    // Update recent activity UI
    updateRecentActivityUI() {
        const container = document.getElementById('recentActivityList');
        if (!container || !this.userData.activities) return;
        
        const recentActivities = this.userData.activities.slice(0, 10); // Show last 10
        
        if (recentActivities.length === 0) {
            container.innerHTML = '<div class="empty-activity">No recent activity</div>';
            return;
        }
        
        container.innerHTML = recentActivities.map(activity => `
            <div class="activity-item">
                <i class="fas fa-circle"></i>
                <div class="activity-details">
                    <div class="activity-title">${activity.description}</div>
                    <div class="activity-time">${new Date(activity.timestamp).toLocaleTimeString()}</div>
                </div>
            </div>
        `).join('');
    }
    
    // Export user data
    exportUserData() {
        const exportData = {
            userData: this.userData,
            purchaseHistory: this.purchaseHistory,
            settings: this.settings,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `2d-user-data-${this.userData.userId}-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        this.trackActivity('Exported user data');
        
        // Show notification
        if (typeof notificationSystem !== 'undefined') {
            notificationSystem.addNotification(
                'Data Exported',
                'Your user data has been downloaded as a JSON file.',
                'system'
            );
        }
    }
    
    // Import user data
    importUserData(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (!confirm('Import user data? This will replace your current data.')) {
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importData = JSON.parse(e.target.result);
                
                // Validate import data
                if (!importData.userData || !importData.userData.userId) {
                    throw new Error('Invalid user data file');
                }
                
                // Import data
                this.userData = importData.userData;
                this.purchaseHistory = importData.purchaseHistory || [];
                this.settings = importData.settings || this.loadSettings();
                
                // Save to localStorage
                this.saveUserData();
                this.savePurchaseHistory();
                this.saveSettings();
                
                // Update UI
                this.updateUserProfile();
                this.loadPurchaseHistoryUI();
                this.updateRecentActivityUI();
                
                this.trackActivity('Imported user data');
                
                alert('✅ User data imported successfully!');
                
                // Show notification
                if (typeof notificationSystem !== 'undefined') {
                    notificationSystem.addNotification(
                        'Data Imported',
                        'Your user data has been imported successfully.',
                        'system'
                    );
                }
                
            } catch (error) {
                console.error('Error importing user data:', error);
                alert('❌ Error importing user data. File may be corrupted.');
            }
        };
        
        reader.readAsText(file);
        
        // Reset file input
        event.target.value = '';
    }
    
    // Generate QR code for syncing
    generateQRCode() {
        const container = document.getElementById('qrCodeContainer');
        if (!container) return;
        
        container.innerHTML = '<div class="loading-qr">Generating QR code...</div>';
        
        // Create sync data
        const syncData = {
            userId: this.userData.userId,
            displayName: this.userData.displayName,
            purchaseHistory: this.purchaseHistory,
            settings: this.settings,
            syncDate: new Date().toISOString()
        };
        
        // Convert to string
        const dataString = JSON.stringify(syncData);
        
        // Generate QR code (using a simple text representation for demo)
        // In a real app, you would use a QR code library like qrcode.js
        setTimeout(() => {
            // Create a simple QR code representation
            const qrDiv = document.createElement('div');
            qrDiv.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <div style="background: white; padding: 20px; display: inline-block; border-radius: 10px;">
                        <div style="font-size: 48px; margin-bottom: 15px;">📱</div>
                        <div style="font-family: monospace; font-size: 12px; color: #666; margin-bottom: 15px;">
                            Sync Code: ${this.userData.userId.substr(0, 12)}
                        </div>
                        <div style="font-size: 10px; color: #999;">
                            Scan with another device<br>to sync your data
                        </div>
                    </div>
                </div>
                <div style="margin-top: 15px; font-size: 12px; color: #aaa;">
                    <p><i class="fas fa-info-circle"></i> Open user profile on another device</p>
                    <p><i class="fas fa-info-circle"></i> Click "Import from QR"</p>
                    <p><i class="fas fa-info-circle"></i> Scan this code</p>
                </div>
            `;
            
            container.innerHTML = '';
            container.appendChild(qrDiv);
            
            this.trackActivity('Generated sync QR code');
            
        }, 1000);
    }
    
    // Import from QR code (simulated)
    importFromQR() {
        const code = prompt('Enter sync code from another device:');
        if (!code) return;
        
        // In a real app, this would decode QR code data
        // For demo, we'll simulate with a simple code
        if (code === this.userData.userId.substr(0, 12)) {
            alert('✅ This is your own device! Scan QR code from another device.');
            return;
        }
        
        // Simulate successful import
        setTimeout(() => {
            this.trackActivity('Synced data from another device');
            
            if (typeof notificationSystem !== 'undefined') {
                notificationSystem.addNotification(
                    'Sync Complete',
                    'User data has been synced from another device.',
                    'system'
                );
            }
            
            alert('✅ Data sync complete! Your purchase history and settings have been updated.');
        }, 1500);
    }
    
    // Clear purchase history
    clearPurchaseHistory() {
        if (!confirm('Clear all purchase history? This cannot be undone.')) return;
        
        this.purchaseHistory = [];
        this.userData.totalPurchases = 0;
        this.userData.totalSpent = 0;
        this.userData.favoritePackage = null;
        
        this.savePurchaseHistory();
        this.saveUserData();
        
        this.updateUserProfile();
        this.loadPurchaseHistoryUI();
        
        this.trackActivity('Cleared purchase history');
        
        alert('✅ Purchase history cleared!');
    }
    
    // Reset user data (keep user ID)
    resetUserData() {
        if (!confirm('Reset all user data? This will clear your purchase history and settings.')) return;
        
        // Keep only user ID
        const userId = this.userData.userId;
        const avatarColor = this.userData.avatarColor;
        
        this.userData = {
            userId: userId,
            displayName: `User_${userId.substr(0, 6)}`,
            createdAt: new Date().toISOString(),
            lastActive: new Date().toISOString(),
            avatarColor: avatarColor,
            totalPurchases: 0,
            totalSpent: 0,
            favoritePackage: null,
            preferences: this.userData.preferences // Keep preferences
        };
        
        this.purchaseHistory = [];
        this.settings = this.loadSettings(); // Reset to defaults
        
        this.saveUserData();
        this.savePurchaseHistory();
        this.saveSettings();
        
        this.updateUserProfile();
        this.loadPurchaseHistoryUI();
        
        this.trackActivity('Reset user data');
        
        alert('✅ User data reset!');
    }
    
    // Clear all user data (complete reset)
    clearAllUserData() {
        if (!confirm('DELETE ALL USER DATA? This will remove everything including your user ID. This cannot be undone!')) return;
        
        localStorage.removeItem(USER_DATA_KEY);
        localStorage.removeItem(PURCHASE_HISTORY_KEY);
        localStorage.removeItem(USER_SETTINGS_KEY);
        
        // Create new user
        this.createNewUser();
        
        // Update UI
        this.updateUserProfile();
        this.loadPurchaseHistoryUI();
        
        alert('✅ All user data deleted! New user created.');
    }
}

// Global user system instance
let userSystem;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    userSystem = new UserSystem();
});

// Global functions for HTML onclick
function openUserProfile() {
    const profileSection = document.getElementById('userProfileSection');
    if (profileSection) {
        profileSection.style.display = 'flex';
        
        // Update user data when opening
        if (userSystem) {
            userSystem.updateUserProfile();
            userSystem.updateRecentActivityUI();
        }
    }
}

function closeUserProfile() {
    const profileSection = document.getElementById('userProfileSection');
    if (profileSection) {
        profileSection.style.display = 'none';
    }
}

function switchProfileTab(tab) {
    // Hide all tabs
    document.querySelectorAll('.profile-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.profile-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    const tabContent = document.getElementById(tab + 'Tab');
    if (tabContent) {
        tabContent.classList.add('active');
    }
    
    // Set active tab button
    const activeBtn = event.target.closest('.profile-tab');
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // Load data for tab
    if (tab === 'history' && userSystem) {
        userSystem.loadPurchaseHistoryUI();
    } else if (tab === 'backup' && userSystem) {
        // Generate QR code when backup tab is opened
        setTimeout(() => userSystem.generateQRCode(), 100);
    }
}

function filterHistory(filter) {
    // Remove active class from all filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Set active class on clicked button
    event.target.classList.add('active');
    
    // Filter history
    if (userSystem) {
        userSystem.loadPurchaseHistoryUI(filter);
    }
}