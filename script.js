// ===========================================
// 2D PLUS LOTTERY WEBSITE - COMPLETE SYSTEM
// ===========================================

// ===========================================
// DOM ELEMENTS
// ===========================================

// Date & Time
const currentDateElement = document.getElementById('currentDate');
const currentTimeElement = document.getElementById('currentTime');

// Notification System
const bellBtn = document.getElementById('bellBtn');
const notificationToggle = document.getElementById('notificationToggle');
const notifyToggle = document.getElementById('notifyToggle');
const toggleStatus = document.getElementById('toggleStatus');
const closeToggleBtn = notificationToggle ? notificationToggle.querySelector('.close-toggle') : null;

// Mobile Menu
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileDropdown = document.getElementById('mobileDropdown');

// VIP Packages System
const packageCards = document.querySelectorAll('.package-card');
const selectedItemsElement = document.getElementById('selectedItems');
const totalAmountElement = document.getElementById('totalAmount');
const confirmBtn = document.getElementById('confirmBtn');
const paymentSection = document.getElementById('paymentSection');

// Closing System Elements
const sessionTextElement = document.getElementById('sessionText');
const sessionStatusElement = document.getElementById('sessionStatus');
const giftSection = document.getElementById('giftSection');
const packagesSection = document.getElementById('packagesSection');
const todayStatusElement = document.getElementById('todayStatus');
const nextOpenDayElement = document.getElementById('nextOpenDay');
const specialDateInput = document.getElementById('specialDateInput');
const specialDatesList = document.getElementById('specialDatesList');

// ===========================================
// DATA & CONFIGURATION
// ===========================================

// Package data
const packages = [
    { id: 1, name: "2 hot keys", price: 5000, available: true },
    { id: 2, name: "1 hot key", price: 10000, available: true },
    { id: 3, name: "8 pairs", price: 15000, available: true }
];

// Selected packages array
let selectedPackages = [];

// Closing System Configuration
let closingConfig = {
    // Default: Saturday (6) and Sunday (0) closed
    weeklyClosingDays: [0, 6], // 0=Sunday, 1=Monday, 2=Tuesday, etc.
    specialClosingDates: [], // Format: "2025-12-25"
    alwaysOpenDates: [] // For overriding weekly closures
};

// ===========================================
// DATE & TIME FUNCTIONS
// ===========================================

// Update date and time
function updateDateTime() {
    const now = new Date();
    
    // Format date: DD.MM.YYYY
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    if (currentDateElement) {
        currentDateElement.textContent = `${day}.${month}.${year}`;
    }
    
    // Format time: Day - HH:MM:SS s
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[now.getDay()];
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    if (currentTimeElement) {
        currentTimeElement.textContent = `${dayName} - ${hours}:${minutes}:${seconds} s`;
    }
}

// ===========================================
// SMART SESSION SYSTEM (Morning/Evening/Closed)
// ===========================================

// Check if today is a closing day
function isTodayClosingDay() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sunday, 6=Saturday
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Check if today is in alwaysOpenDates (override)
    if (closingConfig.alwaysOpenDates.includes(todayStr)) {
        return false;
    }
    
    // Check weekly closing days
    if (closingConfig.weeklyClosingDays.includes(dayOfWeek)) {
        return true;
    }
    
    // Check special closing dates
    if (closingConfig.specialClosingDates.includes(todayStr)) {
        return true;
    }
    
    return false;
}

// Get session type based on time
function getSessionType() {
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
    
    return isMorningSession ? 'morning' : 'evening';
}

// Function to toggle closed state for all sections
function toggleClosedSections(isClosed) {
    if (isClosed) {
        // TODAY IS CLOSED
        
        // Hide all normal content
        document.querySelectorAll('.section-content').forEach(content => {
            content.style.display = 'none';
        });
        
        // Show all closed states
        document.querySelectorAll('.section-closed').forEach(closed => {
            closed.style.display = 'flex';
            closed.classList.add('show');
        });
        
        // Update session text
        updateSessionTextForClosedDay();
        
        // Add closed-day class to body for styling
        document.body.classList.add('closed-day');
        
    } else {
        // TODAY IS OPEN
        
        // Show all normal content
        document.querySelectorAll('.section-content').forEach(content => {
            content.style.display = 'block';
        });
        
        // Hide all closed states
        document.querySelectorAll('.section-closed').forEach(closed => {
            closed.style.display = 'none';
            closed.classList.remove('show');
        });
        
        // Reset session text
        resetSessionText();
        
        // Remove closed-day class from body
        document.body.classList.remove('closed-day');
    }
}

// Update session text when closed
function updateSessionTextForClosedDay() {
    const sessionText = document.getElementById('sessionText');
    if (sessionText) {
        sessionText.textContent = "TODAY 2D CLOSED";
        sessionText.style.color = "#ff6b6b";
        sessionText.style.background = "rgba(255, 107, 107, 0.15)";
        sessionText.style.border = "2px solid rgba(255, 107, 107, 0.5)";
        sessionText.style.fontWeight = "bold";
    }
}

// Reset session text when open
function resetSessionText() {
    const sessionText = document.getElementById('sessionText');
    if (sessionText) {
        const sessionType = getSessionType();
        if (sessionType === 'morning') {
            sessionText.textContent = "Morning session";
            sessionText.style.color = "#4ecdc4";
            sessionText.style.background = "rgba(78, 205, 196, 0.1)";
            sessionText.style.border = "1px solid rgba(78, 205, 196, 0.3)";
        } else {
            sessionText.textContent = "Evening session";
            sessionText.style.color = "#ff6b6b";
            sessionText.style.background = "rgba(255, 107, 107, 0.1)";
            sessionText.style.border = "1px solid rgba(255, 107, 107, 0.3)";
        }
        sessionText.style.fontWeight = "";
    }
}

// Update session display
function updateSessionDisplay() {
    const isClosed = isTodayClosingDay();
    const sessionType = getSessionType();
    
    // Toggle closed sections
    toggleClosedSections(isClosed);
    
    // Update session text
    const sessionTextElement = document.getElementById('sessionText');
    
    if (sessionTextElement) {
        if (isClosed) {
            sessionTextElement.textContent = "TODAY 2D CLOSED";
            sessionTextElement.style.color = "#ff6b6b";
            sessionTextElement.style.background = "rgba(255, 107, 107, 0.15)";
            sessionTextElement.style.border = "2px solid rgba(255, 107, 107, 0.5)";
            sessionTextElement.style.fontWeight = "bold";
        } else {
            if (sessionType === 'morning') {
                sessionTextElement.textContent = "Morning session";
                sessionTextElement.style.color = "#4ecdc4";
                sessionTextElement.style.background = "rgba(78, 205, 196, 0.1)";
                sessionTextElement.style.border = "1px solid rgba(78, 205, 196, 0.3)";
            } else {
                sessionTextElement.textContent = "Evening session";
                sessionTextElement.style.color = "#ff6b6b";
                sessionTextElement.style.background = "rgba(255, 107, 107, 0.1)";
                sessionTextElement.style.border = "1px solid rgba(255, 107, 107, 0.3)";
            }
            sessionTextElement.style.fontWeight = "";
        }
    }
}

// ===========================================
// CLOSING SYSTEM ADMIN FUNCTIONS
// ===========================================

// Load closing configuration from localStorage
function loadClosingConfig() {
    const savedConfig = localStorage.getItem('2dClosingConfig');
    if (savedConfig) {
        try {
            closingConfig = JSON.parse(savedConfig);
        } catch (e) {
            console.error('Error loading closing config:', e);
        }
    }
}

// Save closing configuration to localStorage
function saveClosingConfig() {
    localStorage.setItem('2dClosingConfig', JSON.stringify(closingConfig));
}

// Toggle weekly closing day
function toggleClosingDay(dayIndex) {
    const index = closingConfig.weeklyClosingDays.indexOf(dayIndex);
    const dayBtn = document.querySelector(`.day-btn[data-day="${dayIndex}"]`);
    
    if (index > -1) {
        // Remove from closing days (make it OPEN)
        closingConfig.weeklyClosingDays.splice(index, 1);
        if (dayBtn) {
            dayBtn.classList.remove('closed');
            dayBtn.style.background = '#4CAF50';
        }
    } else {
        // Add to closing days (make it CLOSED)
        closingConfig.weeklyClosingDays.push(dayIndex);
        if (dayBtn) {
            dayBtn.classList.add('closed');
            dayBtn.style.background = '#f44336';
        }
    }
    
    saveClosingConfig();
    updateSessionDisplay();
    updateDayButtons();
}

// Add special closing date
function addSpecialDate() {
    if (!specialDateInput || !specialDateInput.value) return;
    
    const dateStr = specialDateInput.value;
    
    if (!closingConfig.specialClosingDates.includes(dateStr)) {
        closingConfig.specialClosingDates.push(dateStr);
        specialDateInput.value = '';
        saveClosingConfig();
        updateSessionDisplay();
        updateSpecialDatesList();
    }
}

// Remove special closing date
function removeSpecialDate(dateStr) {
    const index = closingConfig.specialClosingDates.indexOf(dateStr);
    if (index > -1) {
        closingConfig.specialClosingDates.splice(index, 1);
        saveClosingConfig();
        updateSessionDisplay();
        updateSpecialDatesList();
    }
}

// Close today (manual override)
function closeToday() {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    if (!closingConfig.specialClosingDates.includes(todayStr)) {
        closingConfig.specialClosingDates.push(todayStr);
        saveClosingConfig();
        updateSessionDisplay();
        updateSpecialDatesList();
        alert("Today has been marked as CLOSED");
    }
}

// Open today (manual override)
function openToday() {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const dayOfWeek = today.getDay();
    
    // Remove from special closing dates
    removeSpecialDate(todayStr);
    
    // Remove from weekly closing days if it's there
    const weeklyIndex = closingConfig.weeklyClosingDays.indexOf(dayOfWeek);
    if (weeklyIndex > -1) {
        closingConfig.weeklyClosingDays.splice(weeklyIndex, 1);
    }
    
    // Add to always open dates
    if (!closingConfig.alwaysOpenDates.includes(todayStr)) {
        closingConfig.alwaysOpenDates.push(todayStr);
    }
    
    saveClosingConfig();
    updateSessionDisplay();
    updateDayButtons();
    updateSpecialDatesList();
    alert("Today has been marked as OPEN");
}

// Reset to default (Saturday & Sunday closed)
function resetClosingDays() {
    if (confirm("Reset to default closing days? (Saturday & Sunday closed)")) {
        closingConfig.weeklyClosingDays = [0, 6]; // Sunday & Saturday
        closingConfig.specialClosingDates = [];
        closingConfig.alwaysOpenDates = [];
        saveClosingConfig();
        updateSessionDisplay();
        updateDayButtons();
        updateSpecialDatesList();
        alert("Reset to default: Saturday & Sunday closed");
    }
}

// Update day buttons display
function updateDayButtons() {
    document.querySelectorAll('.day-btn').forEach(btn => {
        const dayIndex = parseInt(btn.getAttribute('data-day'));
        if (closingConfig.weeklyClosingDays.includes(dayIndex)) {
            btn.classList.add('closed');
            btn.style.background = '#f44336';
        } else {
            btn.classList.remove('closed');
            btn.style.background = '#4CAF50';
        }
    });
}

// Update special dates list
function updateSpecialDatesList() {
    if (!specialDatesList) return;
    
    if (closingConfig.specialClosingDates.length === 0) {
        specialDatesList.innerHTML = '<div class="no-dates">No special closing dates set</div>';
        return;
    }
    
    specialDatesList.innerHTML = closingConfig.specialClosingDates.map(date => `
        <div class="date-item">
            <span>${formatDateDisplay(date)}</span>
            <button class="remove-date" onclick="removeSpecialDate('${date}')">
                Remove
            </button>
        </div>
    `).join('');
}

// Format date for display
function formatDateDisplay(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Find next open day
function getNextOpenDay() {
    const today = new Date();
    
    for (let i = 1; i <= 7; i++) {
        const nextDate = new Date(today);
        nextDate.setDate(today.getDate() + i);
        const nextDayStr = nextDate.toISOString().split('T')[0];
        const nextDayOfWeek = nextDate.getDay();
        
        // Check if it's open
        const isAlwaysOpen = closingConfig.alwaysOpenDates.includes(nextDayStr);
        const isWeeklyClosed = closingConfig.weeklyClosingDays.includes(nextDayOfWeek);
        const isSpecialClosed = closingConfig.specialClosingDates.includes(nextDayStr);
        
        if (isAlwaysOpen || (!isWeeklyClosed && !isSpecialClosed)) {
            const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][nextDayOfWeek];
            return `${dayName}, ${nextDate.getDate()}/${nextDate.getMonth()+1}/${nextDate.getFullYear()}`;
        }
    }
    
    return "No open days found";
}

// Update closing status display
function updateClosingStatusDisplay() {
    const isClosed = isTodayClosingDay();
    const nextOpenDay = getNextOpenDay();
    
    if (todayStatusElement) {
        todayStatusElement.textContent = isClosed ? "CLOSED" : "OPEN";
        todayStatusElement.className = isClosed ? "closed" : "open";
    }
    
    if (nextOpenDayElement) {
        nextOpenDayElement.textContent = isClosed ? nextOpenDay : "Today is open";
    }
}

// ===========================================
// NOTIFICATION SYSTEM
// ===========================================

function initNotificationSystem() {
    if (!bellBtn || !notificationToggle) return;
    
    bellBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        notificationToggle.classList.toggle('show');
    });
    
    if (closeToggleBtn) {
        closeToggleBtn.addEventListener('click', function() {
            notificationToggle.classList.remove('show');
        });
    }
    
    document.addEventListener('click', function(e) {
        if (notificationToggle.classList.contains('show') && 
            !notificationToggle.contains(e.target) && 
            !bellBtn.contains(e.target)) {
            notificationToggle.classList.remove('show');
        }
    });
    
    if (notifyToggle && toggleStatus) {
        notifyToggle.addEventListener('change', function() {
            const isOn = this.checked;
            toggleStatus.textContent = isOn ? 'ON' : 'OFF';
            toggleStatus.style.color = isOn ? '#00d4ff' : '#fff';
            alert(`Notifications turned ${isOn ? 'ON' : 'OFF'}. You will ${isOn ? 'receive' : 'not receive'} updates from Admin.`);
        });
    }
}

// ===========================================
// MOBILE NOTIFICATION TOGGLE SYSTEM
// ===========================================

function initMobileNotificationToggle() {
    const mobileNotificationHeader = document.querySelector('.mobile-notification-header');
    const mobileNotificationToggle = document.querySelector('.mobile-notification-toggle');
    const closeMobileToggle = document.querySelector('.close-mobile-toggle');
    const mobileNotifyToggle = document.getElementById('mobileNotifyToggle');
    const mobileToggleStatus = document.getElementById('mobileToggleStatus');
    
    if (!mobileNotificationHeader || !mobileNotificationToggle) return;
    
    // Toggle notification panel when clicking header
    mobileNotificationHeader.addEventListener('click', function(e) {
        // Don't trigger if clicking the settings cog button
        if (!e.target.closest('.mobile-notification-toggle-btn')) {
            mobileNotificationToggle.classList.toggle('show');
        }
    });
    
    // Open notification panel when clicking settings cog
    const settingsCog = document.querySelector('.mobile-notification-toggle-btn');
    if (settingsCog) {
        settingsCog.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent header click
            mobileNotificationToggle.classList.toggle('show');
        });
    }
    
    // Close notification panel
    if (closeMobileToggle) {
        closeMobileToggle.addEventListener('click', function() {
            mobileNotificationToggle.classList.remove('show');
        });
    }
    
    // Close notification panel when clicking outside
    document.addEventListener('click', function(e) {
        if (mobileNotificationToggle.classList.contains('show') && 
            !mobileNotificationToggle.contains(e.target) && 
            !mobileNotificationHeader.contains(e.target)) {
            mobileNotificationToggle.classList.remove('show');
        }
    });
    
    // Handle mobile toggle switch
    if (mobileNotifyToggle && mobileToggleStatus) {
        // Sync with desktop toggle if it exists
        const desktopToggle = document.getElementById('notifyToggle');
        if (desktopToggle) {
            mobileNotifyToggle.checked = desktopToggle.checked;
            mobileToggleStatus.textContent = desktopToggle.checked ? 'ON' : 'OFF';
            mobileToggleStatus.style.color = desktopToggle.checked ? '#00d4ff' : '#fff';
        }
        
        mobileNotifyToggle.addEventListener('change', function() {
            const isOn = this.checked;
            mobileToggleStatus.textContent = isOn ? 'ON' : 'OFF';
            mobileToggleStatus.style.color = isOn ? '#00d4ff' : '#fff';
            
            // Sync with desktop toggle
            if (desktopToggle) {
                desktopToggle.checked = isOn;
                const desktopStatus = document.getElementById('toggleStatus');
                if (desktopStatus) {
                    desktopStatus.textContent = isOn ? 'ON' : 'OFF';
                    desktopStatus.style.color = isOn ? '#00d4ff' : '#fff';
                }
            }
            
            alert(`Notifications turned ${isOn ? 'ON' : 'OFF'}. You will ${isOn ? 'receive' : 'not receive'} updates from Admin.`);
        });
    }
}

// ===========================================
// MOBILE MENU
// ===========================================

function initMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileDropdown = document.getElementById('mobileDropdown');
    
    if (!mobileMenuBtn || !mobileDropdown) return;
    
    mobileMenuBtn.addEventListener('click', function() {
        mobileDropdown.classList.toggle('show');
        
        // Toggle hamburger icon
        const icon = this.querySelector('i');
        if (mobileDropdown.classList.contains('show')) {
            icon.className = 'fas fa-times'; // X icon when open
        } else {
            icon.className = 'fas fa-bars'; // Hamburger when closed
        }
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (mobileDropdown.classList.contains('show') && 
            !mobileDropdown.contains(e.target) && 
            !mobileMenuBtn.contains(e.target)) {
            mobileDropdown.classList.remove('show');
            mobileMenuBtn.querySelector('i').className = 'fas fa-bars';
        }
    });
    
    // Close dropdown when clicking a menu item
    document.querySelectorAll('.mobile-menu-item').forEach(item => {
        item.addEventListener('click', function() {
            mobileDropdown.classList.remove('show');
            mobileMenuBtn.querySelector('i').className = 'fas fa-bars';
        });
    });
}

// ===========================================
// VIP PACKAGE SELECTION SYSTEM
// ===========================================

function initPackageSelection() {
    packageCards.forEach(card => {
        card.addEventListener('click', function() {
            if (this.classList.contains('unavailable') || isTodayClosingDay()) {
                return;
            }
            
            const packageId = parseInt(this.getAttribute('data-id'));
            const packageData = packages.find(p => p.id === packageId);
            
            if (!packageData) return;
            
            const checkmark = this.querySelector('.checkmark');
            const isSelected = checkmark.classList.contains('selected');
            
            if (isSelected) {
                checkmark.classList.remove('selected');
                this.classList.remove('selected');
                selectedPackages = selectedPackages.filter(p => p.id !== packageId);
            } else {
                checkmark.classList.add('selected');
                this.classList.add('selected');
                selectedPackages.push({
                    id: packageId,
                    name: packageData.name,
                    price: packageData.price
                });
            }
            
            updateSelectionSummary();
        });
    });
}

function updateSelectionSummary() {
    if (selectedPackages.length === 0) {
        selectedItemsElement.textContent = "You haven't selected any package yet";
        totalAmountElement.textContent = "Total amount = 0 Ks";
        confirmBtn.style.display = 'none';
        confirmBtn.classList.remove('show');
        hidePaymentSection();
    } else {
        const total = selectedPackages.reduce((sum, pkg) => sum + pkg.price, 0);
        const itemsText = selectedPackages.map(pkg => pkg.name).join(' + ');
        
        selectedItemsElement.textContent = `You selected: ${itemsText}`;
        totalAmountElement.textContent = `Total amount = ${total.toLocaleString()} Ks`;
        
        confirmBtn.style.display = 'block';
        confirmBtn.classList.add('show');
        hidePaymentSection();
    }
}

function hidePaymentSection() {
    if (paymentSection) {
        paymentSection.classList.remove('show');
        paymentSection.style.display = 'none';
    }
}

function showPaymentSection() {
    if (paymentSection) {
        paymentSection.style.display = 'block';
        setTimeout(() => {
            paymentSection.classList.add('show');
        }, 10);
    }
}

// ===========================================
// PAYMENT SYSTEM
// ===========================================

function initPaymentSystem() {
    if (!confirmBtn || !paymentSection) return;
    
    confirmBtn.addEventListener('click', function() {
        if (selectedPackages.length === 0) {
            alert('Please select at least one VIP package!');
            return;
        }
        
        if (isTodayClosingDay()) {
            alert('2D is closed today. Please come back tomorrow!');
            return;
        }
        
        showPaymentSection();
        paymentSection.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    });
}

// ===========================================
// AUTO-CLOSE MOBILE MENU ON DESKTOP RESIZE
// =========================================== 

function handleWindowResize() {
    const mobileDropdown = document.getElementById('mobileDropdown');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    
    // If window is wider than 768px (desktop), close mobile dropdown
    if (window.innerWidth > 768) {
        if (mobileDropdown && mobileDropdown.classList.contains('show')) {
            mobileDropdown.classList.remove('show');
        }
        
        // Reset hamburger icon to bars
        if (mobileMenuBtn) {
            const icon = mobileMenuBtn.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-bars';
            }
        }
    }
}

// ===========================================
// ADMIN CONTROLS FOR VIP PACKAGES
// ===========================================

function togglePackage(packageId) {
    const packageCard = document.querySelector(`.package-card[data-id="${packageId}"]`);
    const controlBtn = document.getElementById(`control${packageId}`);
    
    if (!packageCard) return;
    
    if (packageCard.classList.contains('unavailable')) {
        packageCard.classList.remove('unavailable');
        packageCard.style.cursor = 'pointer';
        
        if (controlBtn) {
            controlBtn.classList.remove('unavailable-btn');
            controlBtn.classList.add('available-btn');
            controlBtn.innerHTML = `<i class="fas fa-check-circle"></i> Package ${packageId}: Available`;
        }
    } else {
        packageCard.classList.add('unavailable');
        packageCard.style.cursor = 'not-allowed';
        
        const checkmark = packageCard.querySelector('.checkmark');
        if (checkmark) checkmark.classList.remove('selected');
        packageCard.classList.remove('selected');
        
        selectedPackages = selectedPackages.filter(p => p.id !== packageId);
        updateSelectionSummary();
        
        if (controlBtn) {
            controlBtn.classList.remove('available-btn');
            controlBtn.classList.add('unavailable-btn');
            controlBtn.innerHTML = `<i class="fas fa-times-circle"></i> Package ${packageId}: Not Available`;
        }
    }
}

function initAdminControls() {
    [1, 2, 3].forEach(id => {
        const packageCard = document.querySelector(`.package-card[data-id="${id}"]`);
        const controlBtn = document.getElementById(`control${id}`);
        
        if (packageCard && controlBtn) {
            if (packageCard.classList.contains('unavailable')) {
                controlBtn.classList.add('unavailable-btn');
                controlBtn.innerHTML = `<i class="fas fa-times-circle"></i> Package ${id}: Not Available`;
            } else {
                controlBtn.classList.add('available-btn');
                controlBtn.innerHTML = `<i class="fas fa-check-circle"></i> Package ${id}: Available`;
            }
        }
    });
}

// ===========================================
// MANUAL TEST FUNCTIONS (for console)
// ===========================================

// Test: Close all sections
function testCloseAllSections() {
    toggleClosedSections(true);
    console.log("✅ All sections closed");
}

// Test: Open all sections
function testOpenAllSections() {
    toggleClosedSections(false);
    console.log("✅ All sections opened");
}

// Test: Toggle single section
function toggleSingleSection(sectionId, closeIt) {
    const closedElement = document.getElementById(sectionId + 'Closed');
    const contentElement = document.getElementById(sectionId + 'Content');
    
    if (closeIt) {
        if (closedElement) closedElement.classList.add('show');
        if (contentElement) contentElement.style.display = 'none';
    } else {
        if (closedElement) closedElement.classList.remove('show');
        if (contentElement) contentElement.style.display = 'block';
    }
}

// ===========================================
// MAIN INITIALIZATION
// ===========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 2D Plus Website Initializing...');
    
    // Load configurations
    loadClosingConfig();
    
    // Initialize systems
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    initNotificationSystem();
    initMobileMenu();
    initPackageSelection();
    initPaymentSystem();
    initAdminControls();
    
    // Initialize mobile notification toggle
    initMobileNotificationToggle();
    
    // Initialize closing system
    updateSessionDisplay();
    updateDayButtons();
    updateSpecialDatesList();
    updateClosingStatusDisplay();
    
    // Update closing status every minute
    setInterval(updateSessionDisplay, 60000);
    
    // Add package hover effects
    packageCards.forEach(card => {
        if (!card.classList.contains('unavailable')) {
            card.addEventListener('mouseenter', function() {
                if (!isTodayClosingDay()) {
                    this.style.transform = 'translateY(-5px)';
                    this.style.boxShadow = '0 10px 20px rgba(0, 212, 255, 0.3)';
                }
            });
            
            card.addEventListener('mouseleave', function() {
                if (!this.classList.contains('selected')) {
                    this.style.transform = 'translateY(0)';
                    this.style.boxShadow = 'none';
                }
            });
        }
    });
    
    // Check closing status on load
    const isClosed = isTodayClosingDay();
    toggleClosedSections(isClosed);
    
    console.log('✅ 2D Plus Website Initialized Successfully!');
});

// Add resize event listener
window.addEventListener('resize', handleWindowResize);

// Also check on page load
window.addEventListener('DOMContentLoaded', function() {
    handleWindowResize();
});

// ===========================================
// HELPER FUNCTIONS (Console Commands)
// ===========================================

function resetAllPackagesToAvailable() {
    [1, 2, 3].forEach(id => {
        const packageCard = document.querySelector(`.package-card[data-id="${id}"]`);
        const controlBtn = document.getElementById(`control${id}`);
        
        if (packageCard) {
            packageCard.classList.remove('unavailable');
            packageCard.style.cursor = 'pointer';
            const checkmark = packageCard.querySelector('.checkmark');
            if (checkmark) checkmark.classList.remove('selected');
            packageCard.classList.remove('selected');
        }
        
        if (controlBtn) {
            controlBtn.classList.remove('unavailable-btn');
            controlBtn.classList.add('available-btn');
            controlBtn.innerHTML = `<i class="fas fa-check-circle"></i> Package ${id}: Available`;
        }
    });
    
    selectedPackages = [];
    updateSelectionSummary();
    console.log('✅ All packages reset to AVAILABLE');
}

function testNotification() {
    if (notificationToggle) {
        notificationToggle.classList.add('show');
        console.log('🔔 Notification panel shown');
    }
}

function getClosingInfo() {
    console.log('📅 Closing Configuration:', closingConfig);
    console.log('🔍 Today is closed:', isTodayClosingDay());
    console.log('⏰ Current session:', getSessionType());
}