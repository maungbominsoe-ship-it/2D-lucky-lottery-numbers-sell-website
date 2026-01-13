// ===========================================
// AUTO-NOTIFICATION SYSTEM
// ===========================================

// Notification Types
const NOTIFICATION_TYPES = {
    SYSTEM: 'system',
    UPDATE: 'update',
    ALERT: 'alert',
    PAYMENT: 'payment',
    SESSION: 'session'
};

// Notification Storage Key
const NOTIFICATIONS_KEY = '2dNotifications';
const NOTIFICATION_SETTINGS_KEY = '2dNotificationSettings';

// Initialize Notification System
class NotificationSystem {
    constructor() {
        this.notifications = this.loadNotifications();
        this.settings = this.loadSettings();
        this.permission = null;
        this.init();
    }
    
    init() {
        // Check browser notification permission
        if ('Notification' in window) {
            this.permission = Notification.permission;
            
            if (this.permission === 'default') {
                this.showPermissionRequest();
            }
        }
        
        // Load notifications into UI
        this.renderNotifications();
        
        // Setup notification checks
        this.setupNotificationChecks();
        
        // Listen for number updates
        this.listenForNumberUpdates();
        
        // Listen for payment verifications
        this.listenForPayments();
        
        // Setup session reminders
        this.setupSessionReminders();
    }
    
    // Load notifications from localStorage
    loadNotifications() {
        const stored = localStorage.getItem(NOTIFICATIONS_KEY);
        return stored ? JSON.parse(stored) : [];
    }
    
    // Save notifications to localStorage
    saveNotifications() {
        localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(this.notifications));
        this.updateNotificationCount();
    }
    
    // Load settings from localStorage
    loadSettings() {
        const defaultSettings = {
            notifyNumbers: true,
            notifySessions: true,
            notifyPayments: true,
            notifySound: true
        };
        
        const stored = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
        return stored ? {...defaultSettings, ...JSON.parse(stored)} : defaultSettings;
    }
    
    // Save settings to localStorage
    saveSettings() {
        localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(this.settings));
    }
    
    // Add a new notification
    addNotification(title, message, type = NOTIFICATION_TYPES.SYSTEM, data = {}) {
        const notification = {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            title,
            message,
            type,
            timestamp: new Date().toISOString(),
            read: false,
            data
        };
        
        // Add to array (newest first)
        this.notifications.unshift(notification);
        
        // Keep only last 100 notifications
        if (this.notifications.length > 100) {
            this.notifications = this.notifications.slice(0, 100);
        }
        
        // Save to storage
        this.saveNotifications();
        
        // Show notification based on type
        this.showNotification(notification);
        
        // Play sound if enabled
        if (this.settings.notifySound && this.shouldNotify(type)) {
            this.playNotificationSound();
        }
        
        return notification;
    }
    
    // Show notification (browser or toast)
    showNotification(notification) {
        // Check if we should show this type of notification
        if (!this.shouldNotify(notification.type)) {
            return;
        }
        
        // Show browser notification if permission granted and document hidden
        if (this.permission === 'granted' && document.hidden) {
            this.showBrowserNotification(notification);
        } else {
            // Show toast notification
            this.showToastNotification(notification);
        }
        
        // Update UI
        this.renderNotifications();
    }
    
    // Show browser notification
    showBrowserNotification(notification) {
        const options = {
            body: notification.message,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: notification.id,
            requireInteraction: notification.type === NOTIFICATION_TYPES.ALERT,
            data: notification.data
        };
        
        // Add different icons for different types
        switch (notification.type) {
            case NOTIFICATION_TYPES.UPDATE:
                options.icon = 'https://img.icons8.com/color/96/000000/calendar--v1.png';
                break;
            case NOTIFICATION_TYPES.PAYMENT:
                options.icon = 'https://img.icons8.com/color/96/000000/money-bag.png';
                break;
            case NOTIFICATION_TYPES.ALERT:
                options.icon = 'https://img.icons8.com/color/96/000000/high-importance.png';
                break;
            case NOTIFICATION_TYPES.SESSION:
                options.icon = 'https://img.icons8.com/color/96/000000/clock--v1.png';
                break;
        }
        
        const browserNotification = new Notification(`2D Plus: ${notification.title}`, options);
        
        // Handle click on notification
        browserNotification.onclick = () => {
            window.focus();
            browserNotification.close();
            
            // Mark as read
            this.markAsRead(notification.id);
            
            // Handle notification action
            this.handleNotificationAction(notification);
        };
        
        // Auto close after 5 seconds
        setTimeout(() => browserNotification.close(), 5000);
    }
    
    // Show toast notification
    showToastNotification(notification) {
        const toast = document.createElement('div');
        toast.className = 'notification-toast';
        toast.dataset.id = notification.id;
        
        // Set icon based on type
        let icon = '🔔';
        switch (notification.type) {
            case NOTIFICATION_TYPES.UPDATE:
                icon = '🔄';
                break;
            case NOTIFICATION_TYPES.PAYMENT:
                icon = '💰';
                break;
            case NOTIFICATION_TYPES.ALERT:
                icon = '⚠️';
                break;
            case NOTIFICATION_TYPES.SESSION:
                icon = '⏰';
                break;
        }
        
        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-content">
                <div class="toast-title">${notification.title}</div>
                <div class="toast-message">${notification.message}</div>
            </div>
            <button class="close-toast" onclick="this.parentElement.remove()">&times;</button>
        `;
        
        // Add to page
        document.body.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
        
        // Click to mark as read
        toast.addEventListener('click', (e) => {
            if (!e.target.classList.contains('close-toast')) {
                this.markAsRead(notification.id);
                this.handleNotificationAction(notification);
                toast.remove();
            }
        });
    }
    
    // Play notification sound
    playNotificationSound() {
        // Create audio context for sound
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch (e) {
            // Fallback to simple beep for older browsers
            console.log('🔔 Notification!');
        }
    }
    
    // Mark notification as read
    markAsRead(id) {
        const notification = this.notifications.find(n => n.id === id);
        if (notification) {
            notification.read = true;
            this.saveNotifications();
            this.renderNotifications();
        }
    }
    
    // Mark all as read
    markAllAsRead() {
        this.notifications.forEach(notification => {
            notification.read = true;
        });
        this.saveNotifications();
        this.renderNotifications();
    }
    
    // Clear all notifications
    clearAllNotifications() {
        if (confirm('Clear all notifications?')) {
            this.notifications = [];
            this.saveNotifications();
            this.renderNotifications();
        }
    }
    
    // Get unread count
    getUnreadCount() {
        return this.notifications.filter(n => !n.read).length;
    }
    
    // Update notification count in UI
    updateNotificationCount() {
        const count = this.getUnreadCount();
        
        // Update floating button
        const floatingCount = document.getElementById('floatingNotificationCount');
        if (floatingCount) {
            floatingCount.textContent = count;
            floatingCount.style.display = count > 0 ? 'block' : 'none';
        }
        
        // Update badge in tabs
        const unreadBadge = document.getElementById('unreadBadge');
        if (unreadBadge) {
            unreadBadge.textContent = count;
        }
    }
    
    // Render notifications to UI
    renderNotifications(filter = 'all') {
        const container = document.getElementById('notificationList');
        if (!container) return;
        
        let filteredNotifications = this.notifications;
        
        if (filter === 'unread') {
            filteredNotifications = this.notifications.filter(n => !n.read);
        } else if (filter === 'system') {
            filteredNotifications = this.notifications.filter(n => n.type === NOTIFICATION_TYPES.SYSTEM);
        }
        
        if (filteredNotifications.length === 0) {
            container.innerHTML = `
                <div class="empty-notifications">
                    <i class="fas fa-bell-slash"></i>
                    <p>No notifications yet</p>
                    <p class="subtext">You'll get notified about updates here</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = filteredNotifications.map(notification => `
            <div class="notification-item ${notification.read ? '' : 'unread'}" 
                 onclick="notificationSystem.markAsRead('${notification.id}')">
                <div class="notification-header">
                    <div class="notification-title">
                        <i class="${this.getNotificationIcon(notification.type)}"></i>
                        ${notification.title}
                    </div>
                    <div class="notification-time">
                        ${this.formatTime(notification.timestamp)}
                    </div>
                </div>
                <div class="notification-message">
                    <span class="notification-type type-${notification.type}">
                        ${notification.type.toUpperCase()}
                    </span>
                    ${notification.message}
                </div>
            </div>
        `).join('');
        
        this.updateNotificationCount();
    }
    
    // Get icon for notification type
    getNotificationIcon(type) {
        switch (type) {
            case NOTIFICATION_TYPES.UPDATE: return 'fas fa-sync-alt';
            case NOTIFICATION_TYPES.PAYMENT: return 'fas fa-money-bill-wave';
            case NOTIFICATION_TYPES.ALERT: return 'fas fa-exclamation-triangle';
            case NOTIFICATION_TYPES.SESSION: return 'fas fa-clock';
            default: return 'fas fa-info-circle';
        }
    }
    
    // Format time for display
    formatTime(timestamp) {
        const now = new Date();
        const date = new Date(timestamp);
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString();
    }
    
    // Check if we should notify for this type
    shouldNotify(type) {
        switch (type) {
            case NOTIFICATION_TYPES.UPDATE:
                return this.settings.notifyNumbers;
            case NOTIFICATION_TYPES.SESSION:
                return this.settings.notifySessions;
            case NOTIFICATION_TYPES.PAYMENT:
                return this.settings.notifyPayments;
            default:
                return true;
        }
    }
    
    // Show permission request
    showPermissionRequest() {
        // Check if we've asked recently
        const lastAsk = localStorage.getItem('notificationPermissionLastAsk');
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        
        if (lastAsk && parseInt(lastAsk) > oneWeekAgo) {
            return; // Asked less than a week ago
        }
        
        // Create permission request
        const permissionDiv = document.createElement('div');
        permissionDiv.className = 'notification-permission';
        permissionDiv.innerHTML = `
            <div class="notification-permission-content">
                <h4><i class="fas fa-bell"></i> Enable Notifications</h4>
                <p>Get notified when numbers are updated, sessions start, and payments are verified. Never miss an update!</p>
                <div class="permission-buttons">
                    <button class="allow-btn" onclick="notificationSystem.requestPermission()">Allow</button>
                    <button class="deny-btn" onclick="notificationSystem.hidePermissionRequest()">Not Now</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(permissionDiv);
        localStorage.setItem('notificationPermissionLastAsk', Date.now().toString());
        
        // Store reference for removal
        this.permissionRequest = permissionDiv;
    }
    
    // Hide permission request
    hidePermissionRequest() {
        if (this.permissionRequest && this.permissionRequest.parentElement) {
            this.permissionRequest.remove();
        }
    }
    
    // Request browser permission
    async requestPermission() {
        this.hidePermissionRequest();
        
        if (!('Notification' in window)) {
            alert('Your browser does not support notifications');
            return;
        }
        
        try {
            const permission = await Notification.requestPermission();
            this.permission = permission;
            
            if (permission === 'granted') {
                this.addNotification(
                    'Notifications Enabled',
                    'You will now receive notifications for updates and sessions.',
                    NOTIFICATION_TYPES.SYSTEM
                );
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
        }
    }
    
    // Setup periodic notification checks
    setupNotificationChecks() {
        // Check every minute for scheduled notifications
        setInterval(() => {
            this.checkScheduledNotifications();
        }, 60000);
        
        // Initial check
        this.checkScheduledNotifications();
    }
    
    // Check for scheduled notifications
    checkScheduledNotifications() {
        // Check for session reminders
        this.checkSessionReminders();
        
        // Check for number updates (from admin)
        this.checkNumberUpdates();
    }
    
    // Listen for number updates from admin
    listenForNumberUpdates() {
        window.addEventListener('numbersUpdated', (event) => {
            const numbers = event.detail;
            
            if (this.settings.notifyNumbers) {
                this.addNotification(
                    'Numbers Updated!',
                    `New numbers are available. Check the gift section for updates.`,
                    NOTIFICATION_TYPES.UPDATE,
                    { action: 'showGiftSection' }
                );
            }
        });
        
        // Also check localStorage for updates
        window.addEventListener('storage', (event) => {
            if (event.key === '2dCurrentNumbers') {
                if (this.settings.notifyNumbers) {
                    this.addNotification(
                        'Numbers Updated!',
                        'Admin has updated the lottery numbers.',
                        NOTIFICATION_TYPES.UPDATE
                    );
                }
            }
        });
    }
    
    // Listen for payment verifications
    listenForPayments() {
        // Listen for storage changes (when admin approves/rejects)
        window.addEventListener('storage', (event) => {
            if (event.key === 'paymentVerifications') {
                const verifications = JSON.parse(event.newValue || '[]');
                const lastVerification = verifications[verifications.length - 1];
                
                if (lastVerification && this.settings.notifyPayments) {
                    if (lastVerification.status === 'approved') {
                        this.addNotification(
                            'Payment Approved!',
                            `Your payment of ${lastVerification.totalAmount.toLocaleString()} Ks has been approved.`,
                            NOTIFICATION_TYPES.PAYMENT
                        );
                    } else if (lastVerification.status === 'rejected') {
                        this.addNotification(
                            'Payment Rejected',
                            `Your payment was rejected. Reason: ${lastVerification.rejectionReason || 'No reason provided'}`,
                            NOTIFICATION_TYPES.ALERT
                        );
                    }
                }
            }
        });
    }
    
    // Setup session reminders
    setupSessionReminders() {
        // Check current session and send reminder
        this.checkSessionReminders();
        
        // Check every 30 minutes for session changes
        setInterval(() => {
            this.checkSessionReminders();
        }, 30 * 60 * 1000);
    }
    
    // Check and send session reminders
    checkSessionReminders() {
        if (!this.settings.notifySessions) return;
        
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        // Morning session: 12:01 AM to 12:02 PM
        // Evening session: 12:02 PM to 12:01 AM
        
        let isMorningSession = false;
        
        if (currentHour === 0 && currentMinute >= 1) { 
            isMorningSession = true;
        } else if (currentHour >= 1 && currentHour < 12) {
            isMorningSession = true;
        } else if (currentHour === 12 && currentMinute <= 2) {
            isMorningSession = true;
        }
        
        const sessionType = isMorningSession ? 'Morning' : 'Evening';
        const sessionKey = `sessionNotified_${sessionType}_${now.toDateString()}`;
        
        // Check if we've already notified for this session today
        const alreadyNotified = localStorage.getItem(sessionKey);
        
        if (!alreadyNotified) {
            // Check if it's within 5 minutes of session start
            const isNearSessionStart = 
                (currentHour === 0 && currentMinute >= 1 && currentMinute <= 5) || // Morning start
                (currentHour === 12 && currentMinute >= 2 && currentMinute <= 7); // Evening start
            
            if (isNearSessionStart) {
                this.addNotification(
                    `${sessionType} Session Starting`,
                    `The ${sessionType.toLowerCase()} session is starting soon! Check the latest numbers.`,
                    NOTIFICATION_TYPES.SESSION,
                    { action: 'showSession' }
                );
                
                // Mark as notified
                localStorage.setItem(sessionKey, 'true');
            }
        }
    }
    
    // Check for number updates from admin
    checkNumberUpdates() {
        // This would check if admin has updated numbers recently
        // For now, we rely on the event listener
    }
    
    // Handle notification action
    handleNotificationAction(notification) {
        const action = notification.data?.action;
        
        if (action === 'showGiftSection') {
            const giftSection = document.querySelector('.gift-section');
            if (giftSection) {
                giftSection.scrollIntoView({ behavior: 'smooth' });
            }
        } else if (action === 'showSession') {
            const datetimeSection = document.querySelector('.datetime-section');
            if (datetimeSection) {
                datetimeSection.scrollIntoView({ behavior: 'smooth' });
            }
        }
        
        // Close notification modal if open
        this.closeNotificationModal();
    }
    
    // Open notification modal
    openNotificationModal(filter = 'all') {
        const modal = document.getElementById('notificationModal');
        if (modal) {
            modal.classList.add('show');
            this.renderNotifications(filter);
            
            // Set active tab
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            event?.target?.classList?.add('active');
        }
    }
    
    // Close notification modal
    closeNotificationModal() {
        const modal = document.getElementById('notificationModal');
        if (modal) {
            modal.classList.remove('show');
        }
    }
    
    // Switch notification tab
    switchNotificationTab(tab) {
        this.renderNotifications(tab);
    }
    
    // Update settings from UI
    updateSettings() {
        this.settings = {
            notifyNumbers: document.getElementById('notifyNumbers')?.checked ?? true,
            notifySessions: document.getElementById('notifySessions')?.checked ?? true,
            notifyPayments: document.getElementById('notifyPayments')?.checked ?? true,
            notifySound: document.getElementById('notifySound')?.checked ?? true
        };
        
        this.saveSettings();
    }
}

// Global notification system instance
let notificationSystem;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    notificationSystem = new NotificationSystem();
    
    // Load settings into UI
    setTimeout(() => {
        const settings = notificationSystem.settings;
        
        const notifyNumbers = document.getElementById('notifyNumbers');
        const notifySessions = document.getElementById('notifySessions');
        const notifyPayments = document.getElementById('notifyPayments');
        const notifySound = document.getElementById('notifySound');
        
        if (notifyNumbers) notifyNumbers.checked = settings.notifyNumbers;
        if (notifySessions) notifySessions.checked = settings.notifySessions;
        if (notifyPayments) notifyPayments.checked = settings.notifyPayments;
        if (notifySound) notifySound.checked = settings.notifySound;
        
        // Add change listeners
        [notifyNumbers, notifySessions, notifyPayments, notifySound].forEach(input => {
            if (input) {
                input.addEventListener('change', () => notificationSystem.updateSettings());
            }
        });
    }, 1000);
    
    // Add welcome notification
    setTimeout(() => {
        if (notificationSystem.notifications.length === 0) {
            notificationSystem.addNotification(
                'Welcome to 2D Plus!',
                'You will receive notifications here for number updates, session reminders, and payment status.',
                NOTIFICATION_TYPES.SYSTEM
            );
        }
    }, 2000);
});

// Global functions for HTML onclick
function openNotificationModal(filter = 'all') {
    if (notificationSystem) {
        notificationSystem.openNotificationModal(filter);
    }
}

function closeNotificationModal() {
    if (notificationSystem) {
        notificationSystem.closeNotificationModal();
    }
}

function switchNotificationTab(tab) {
    if (notificationSystem) {
        notificationSystem.switchNotificationTab(tab);
    }
}

function markAllAsRead() {
    if (notificationSystem) {
        notificationSystem.markAllAsRead();
    }
}

function clearAllNotifications() {
    if (notificationSystem) {
        notificationSystem.clearAllNotifications();
    }
}