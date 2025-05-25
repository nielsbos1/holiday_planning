// Holiday Planner Application
class HolidayPlanner {
    constructor() {
        this.currentYear = 2025;
        this.holidayDays = {
            daysFromLastYear: 0,
            loyaltyDays: 0,
            regularDays: 25,
            boughtDays: 0,
            bonusDays: 0
        };
        this.selectedDays = new Map();
        this.publicHolidays = this.getDutchPublicHolidays2025();
        this.companyHolidays = [];
        this.scenarios = {};
        this.currentScenario = 'Default';
        
        this.init();
    }

    // Dutch public holidays for 2025
    getDutchPublicHolidays2025() {
        return [
            { date: '2025-01-01', name: 'Nieuwjaarsdag' },
            { date: '2025-04-18', name: 'Goede Vrijdag' },
            { date: '2025-04-20', name: 'Paaszondag' },
            { date: '2025-04-21', name: 'Paasmaandag' },
            { date: '2025-04-27', name: 'Koningsdag' },
            { date: '2025-05-05', name: 'Bevrijdingsdag' },
            { date: '2025-05-29', name: 'Hemelvaartsdag' },
            { date: '2025-06-08', name: 'Pinksterzondag' },
            { date: '2025-06-09', name: 'Pinkstermaandag' },
            { date: '2025-12-25', name: 'Eerste Kerstdag' },
            { date: '2025-12-26', name: 'Tweede Kerstdag' }
        ];
    }

    init() {
        this.bindEvents();
        this.loadFromStorage();
        this.renderCalendar();
        this.renderPublicHolidays();
        this.renderCompanyHolidays();
        this.renderScenarios();
        this.updateCurrentScenarioDisplay();
        this.updateStats();
    }

    bindEvents() {
        // Holiday day inputs
        const holidayInputs = ['daysFromLastYear', 'loyaltyDays', 'regularDays', 'boughtDays', 'bonusDays'];
        holidayInputs.forEach(inputId => {
            document.getElementById(inputId).addEventListener('input', (e) => {
                const key = inputId;
                this.holidayDays[key] = parseFloat(e.target.value) || 0;
                this.updateTotalDays();
                this.updateStats();
                this.saveToStorage();
            });
        });

        // Year navigation
        document.getElementById('prevYear').addEventListener('click', () => {
            this.currentYear--;
            this.updateYearDisplay();
            this.renderCalendar();
        });

        document.getElementById('nextYear').addEventListener('click', () => {
            this.currentYear++;
            this.updateYearDisplay();
            this.renderCalendar();
        });

        // Action buttons
        document.getElementById('clearAll').addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all selected holidays?')) {
                this.selectedDays.clear();
                this.renderCalendar();
                this.updateStats();
                this.saveToStorage();
            }
        });

        document.getElementById('exportData').addEventListener('click', () => {
            this.exportData();
        });

        // Company holiday management
        document.getElementById('addCompanyHoliday').addEventListener('click', () => {
            this.addCompanyHoliday();
        });

        // Allow Enter key to add company holiday
        document.getElementById('companyHolidayName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addCompanyHoliday();
            }
        });

        // Scenario management
        document.getElementById('saveScenario').addEventListener('click', () => {
            this.saveScenario();
        });

        document.getElementById('resetToDefault').addEventListener('click', () => {
            this.loadDefaultScenario();
        });

        document.getElementById('exportScenarios').addEventListener('click', () => {
            this.exportScenarios();
        });

        document.getElementById('importScenariosBtn').addEventListener('click', () => {
            document.getElementById('importScenarios').click();
        });

        document.getElementById('importScenarios').addEventListener('change', (e) => {
            this.importScenarios(e);
        });

        // Allow Enter key to save scenario
        document.getElementById('scenarioName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.saveScenario();
            }
        });
    }

    updateTotalDays() {
        const total = Object.values(this.holidayDays).reduce((sum, days) => sum + days, 0);
        document.getElementById('totalCalculated').textContent = total % 1 === 0 ? total : total.toFixed(1);
        return total;
    }

    getTotalDays() {
        return Object.values(this.holidayDays).reduce((sum, days) => sum + days, 0);
    }

    updateYearDisplay() {
        document.getElementById('currentYear').textContent = this.currentYear;
    }

    renderCalendar() {
        const calendarGrid = document.getElementById('calendarGrid');
        calendarGrid.innerHTML = '';

        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        const dayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        months.forEach((month, monthIndex) => {
            const monthDiv = document.createElement('div');
            monthDiv.className = 'month';

            const monthHeader = document.createElement('div');
            monthHeader.className = 'month-header';
            monthHeader.textContent = month;
            monthDiv.appendChild(monthHeader);

            const daysGrid = document.createElement('div');
            daysGrid.className = 'days-grid';

            // Add day headers
            dayHeaders.forEach(day => {
                const dayHeader = document.createElement('div');
                dayHeader.className = 'day-header';
                dayHeader.textContent = day;
                daysGrid.appendChild(dayHeader);
            });

            // Get first day of month and number of days
            const firstDay = new Date(this.currentYear, monthIndex, 1);
            const lastDay = new Date(this.currentYear, monthIndex + 1, 0);
            const daysInMonth = lastDay.getDate();
            
            // Adjust for Monday start (getDay() returns 0 for Sunday, 1 for Monday, etc.)
            let startDay = firstDay.getDay();
            startDay = startDay === 0 ? 6 : startDay - 1; // Convert to Monday = 0

            // Add empty cells for days before month starts
            for (let i = 0; i < startDay; i++) {
                const emptyDay = document.createElement('div');
                emptyDay.className = 'day other-month';
                daysGrid.appendChild(emptyDay);
            }

            // Add days of the month
            for (let day = 1; day <= daysInMonth; day++) {
                const dayDiv = document.createElement('div');
                dayDiv.className = 'day';
                dayDiv.textContent = day;

                const dateStr = `${this.currentYear}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayOfWeek = new Date(this.currentYear, monthIndex, day).getDay();

                // Add classes based on day type
                if (dayOfWeek === 0 || dayOfWeek === 6) {
                    dayDiv.classList.add('weekend');
                }

                if (this.isPublicHoliday(dateStr)) {
                    dayDiv.classList.add('public-holiday');
                }

                if (this.isCompanyHoliday(dateStr)) {
                    dayDiv.classList.add('company-holiday');
                }

                if (this.selectedDays.has(dateStr)) {
                    const isFullDay = this.selectedDays.get(dateStr);
                    if (isFullDay) {
                        dayDiv.classList.add('selected');
                    } else {
                        dayDiv.classList.add('half-day');
                    }
                }

                // Check if it's today
                const today = new Date();
                if (this.currentYear === today.getFullYear() && 
                    monthIndex === today.getMonth() && 
                    day === today.getDate()) {
                    dayDiv.classList.add('today');
                }

                // Add click event
                dayDiv.addEventListener('click', () => {
                    this.toggleDay(dateStr, dayDiv);
                });

                // Add right-click event for half days
                dayDiv.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.toggleDay(dateStr, dayDiv, true);
                });

                daysGrid.appendChild(dayDiv);
            }

            monthDiv.appendChild(daysGrid);
            calendarGrid.appendChild(monthDiv);
        });
    }

    isPublicHoliday(dateStr) {
        return this.publicHolidays.some(holiday => holiday.date === dateStr);
    }

    isCompanyHoliday(dateStr) {
        return this.companyHolidays.some(holiday => holiday.date === dateStr);
    }

    toggleDay(dateStr, dayElement, forceHalfDay = false) {
        // Don't allow selection of public holidays or company holidays
        if (this.isPublicHoliday(dateStr) || this.isCompanyHoliday(dateStr)) {
            return;
        }

        // Remove existing classes
        dayElement.classList.remove('selected', 'half-day');

        if (this.selectedDays.has(dateStr)) {
            const currentIsFullDay = this.selectedDays.get(dateStr);
            
            if (forceHalfDay) {
                // Right-click: toggle between no selection and half day
                if (currentIsFullDay) {
                    // Full day -> Half day
                    this.selectedDays.set(dateStr, false);
                    dayElement.classList.add('half-day');
                } else {
                    // Half day -> No selection
                    this.selectedDays.delete(dateStr);
                }
            } else {
                // Left-click: cycle through states
                if (currentIsFullDay) {
                    // Full day -> No selection
                    this.selectedDays.delete(dateStr);
                } else {
                    // Half day -> Full day
                    this.selectedDays.set(dateStr, true);
                    dayElement.classList.add('selected');
                }
            }
        } else {
            // No selection -> add selection
            if (forceHalfDay) {
                // Right-click: add as half day
                this.selectedDays.set(dateStr, false);
                dayElement.classList.add('half-day');
            } else {
                // Left-click: add as full day
                this.selectedDays.set(dateStr, true);
                dayElement.classList.add('selected');
            }
        }

        this.updateStats();
        this.saveToStorage();
    }

    renderPublicHolidays() {
        const publicHolidaysDiv = document.getElementById('publicHolidays');
        publicHolidaysDiv.innerHTML = '';

        this.publicHolidays.forEach(holiday => {
            const holidayDiv = document.createElement('div');
            holidayDiv.className = 'holiday-item';

            const date = new Date(holiday.date);
            const formattedDate = date.toLocaleDateString('nl-NL', { 
                day: 'numeric', 
                month: 'short' 
            });

            holidayDiv.innerHTML = `
                <span class="holiday-date">${formattedDate}</span>
                <span class="holiday-name">${holiday.name}</span>
            `;

            publicHolidaysDiv.appendChild(holidayDiv);
        });
    }

    renderCompanyHolidays() {
        const companyHolidaysDiv = document.getElementById('companyHolidays');
        companyHolidaysDiv.innerHTML = '';

        if (this.companyHolidays.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.style.cssText = 'color: #64748b; font-style: italic; text-align: center; padding: 16px;';
            emptyMessage.textContent = 'No company holidays added yet';
            companyHolidaysDiv.appendChild(emptyMessage);
            return;
        }

        this.companyHolidays.forEach((holiday, index) => {
            const holidayDiv = document.createElement('div');
            holidayDiv.className = 'company-holiday-item';

            const date = new Date(holiday.date);
            const formattedDate = date.toLocaleDateString('nl-NL', { 
                day: 'numeric', 
                month: 'short' 
            });

            holidayDiv.innerHTML = `
                <span class="holiday-date">${formattedDate}</span>
                <span class="holiday-name">${holiday.name}</span>
                <button class="delete-company-holiday" data-index="${index}" title="Delete holiday">
                    <i class="fas fa-trash"></i>
                </button>
            `;

            // Add delete event listener
            const deleteBtn = holidayDiv.querySelector('.delete-company-holiday');
            deleteBtn.addEventListener('click', () => {
                this.deleteCompanyHoliday(index);
            });

            companyHolidaysDiv.appendChild(holidayDiv);
        });
    }

    updateStats() {
        // Calculate used days considering half days
        let usedDays = 0;
        for (const [date, isFullDay] of this.selectedDays) {
            usedDays += isFullDay ? 1 : 0.5;
        }
        
        const totalDays = this.getTotalDays();
        const remainingDays = Math.max(0, totalDays - usedDays);
        const progressPercentage = totalDays > 0 ? (usedDays / totalDays) * 100 : 0;

        document.getElementById('totalDaysDisplay').textContent = totalDays % 1 === 0 ? totalDays : totalDays.toFixed(1);
        document.getElementById('usedDays').textContent = usedDays % 1 === 0 ? usedDays : usedDays.toFixed(1);
        document.getElementById('remainingDays').textContent = remainingDays % 1 === 0 ? remainingDays : remainingDays.toFixed(1);
        document.getElementById('progressFill').style.width = `${Math.min(progressPercentage, 100)}%`;

        // Update remaining days color
        const remainingElement = document.getElementById('remainingDays');
        if (remainingDays < 0) {
            remainingElement.style.color = '#dc2626';
        } else if (remainingDays < 5) {
            remainingElement.style.color = '#f59e0b';
        } else {
            remainingElement.style.color = '#059669';
        }
    }

    saveToStorage() {
        const data = {
            holidayDays: this.holidayDays,
            selectedDays: Array.from(this.selectedDays.entries()),
            currentYear: this.currentYear,
            companyHolidays: this.companyHolidays,
            scenarios: this.scenarios,
            currentScenario: this.currentScenario
        };
        localStorage.setItem('holidayPlannerData', JSON.stringify(data));
    }

    loadFromStorage() {
        const saved = localStorage.getItem('holidayPlannerData');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                
                // Handle new holiday days structure or convert from old totalDays
                if (data.holidayDays) {
                    this.holidayDays = data.holidayDays;
                } else if (data.totalDays) {
                    // Convert old format to new format
                    this.holidayDays = {
                        daysFromLastYear: 0,
                        loyaltyDays: 0,
                        regularDays: data.totalDays,
                        boughtDays: 0,
                        bonusDays: 0
                    };
                } else {
                    this.holidayDays = {
                        daysFromLastYear: 0,
                        loyaltyDays: 0,
                        regularDays: 25,
                        boughtDays: 0,
                        bonusDays: 0
                    };
                }
                
                // Handle both old format (array of dates) and new format (array of [date, isFullDay] pairs)
                if (data.selectedDays && data.selectedDays.length > 0) {
                    if (Array.isArray(data.selectedDays[0])) {
                        // New format: array of [date, isFullDay] pairs
                        this.selectedDays = new Map(data.selectedDays);
                    } else {
                        // Old format: array of dates (assume all full days)
                        this.selectedDays = new Map(data.selectedDays.map(date => [date, true]));
                    }
                } else {
                    this.selectedDays = new Map();
                }
                
                this.currentYear = data.currentYear || 2025;
                this.companyHolidays = data.companyHolidays || [];
                this.scenarios = data.scenarios || {};
                this.currentScenario = data.currentScenario || 'Default';

                // Update all input fields
                document.getElementById('daysFromLastYear').value = this.holidayDays.daysFromLastYear;
                document.getElementById('loyaltyDays').value = this.holidayDays.loyaltyDays;
                document.getElementById('regularDays').value = this.holidayDays.regularDays;
                document.getElementById('boughtDays').value = this.holidayDays.boughtDays;
                document.getElementById('bonusDays').value = this.holidayDays.bonusDays;
                
                this.updateTotalDays();
                this.updateYearDisplay();
            } catch (e) {
                console.error('Error loading saved data:', e);
            }
        }
    }

    exportData() {
        const selectedDaysArray = Array.from(this.selectedDays.entries()).sort((a, b) => a[0].localeCompare(b[0]));
        
        // Calculate used days
        let usedDays = 0;
        for (const [date, isFullDay] of this.selectedDays) {
            usedDays += isFullDay ? 1 : 0.5;
        }
        
        const data = {
            holidayDayBreakdown: this.holidayDays,
            totalHolidayDays: this.getTotalDays(),
            usedDays: usedDays,
            remainingDays: this.getTotalDays() - usedDays,
            currentScenario: this.currentScenario,
            selectedHolidays: selectedDaysArray.map(([date, isFullDay]) => {
                const dateObj = new Date(date);
                return {
                    date: date,
                    isFullDay: isFullDay,
                    dayType: isFullDay ? 'Full Day' : 'Half Day',
                    formattedDate: dateObj.toLocaleDateString('nl-NL', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })
                };
            }),
            publicHolidays: this.publicHolidays,
            companyHolidays: this.companyHolidays,
            scenarios: this.scenarios,
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `holiday-plan-${this.currentYear}-${this.currentScenario.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Show success message
        this.showNotification('Holiday plan exported successfully!', 'success');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        let backgroundColor;
        switch (type) {
            case 'success':
                backgroundColor = '#10b981';
                break;
            case 'error':
                backgroundColor = '#ef4444';
                break;
            default:
                backgroundColor = '#3b82f6';
        }
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 24px;
            background: ${backgroundColor};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            font-weight: 500;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    addCompanyHoliday() {
        const dateInput = document.getElementById('companyHolidayDate');
        const nameInput = document.getElementById('companyHolidayName');
        
        const date = dateInput.value;
        const name = nameInput.value.trim();

        if (!date || !name) {
            this.showNotification('Please enter both date and name for the company holiday', 'error');
            return;
        }

        // Check if holiday already exists
        if (this.isCompanyHoliday(date)) {
            this.showNotification('A company holiday already exists on this date', 'error');
            return;
        }

        // Check if it's a public holiday
        if (this.isPublicHoliday(date)) {
            this.showNotification('This date is already a public holiday', 'error');
            return;
        }

        // Add the holiday
        this.companyHolidays.push({ date, name });
        this.companyHolidays.sort((a, b) => new Date(a.date) - new Date(b.date));

        // Clear inputs
        dateInput.value = '';
        nameInput.value = '';

        // Update UI
        this.renderCompanyHolidays();
        this.renderCalendar();
        this.saveToStorage();

        this.showNotification('Company holiday added successfully!', 'success');
    }

    deleteCompanyHoliday(index) {
        if (confirm('Are you sure you want to delete this company holiday?')) {
            this.companyHolidays.splice(index, 1);
            this.renderCompanyHolidays();
            this.renderCalendar();
            this.saveToStorage();
            this.showNotification('Company holiday deleted', 'success');
        }
    }

    renderScenarios() {
        const scenariosDiv = document.getElementById('scenariosList');
        scenariosDiv.innerHTML = '';

        if (Object.keys(this.scenarios).length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.style.cssText = 'color: #64748b; font-style: italic; text-align: center; padding: 16px;';
            emptyMessage.textContent = 'No saved scenarios yet';
            scenariosDiv.appendChild(emptyMessage);
            return;
        }

        for (const [scenarioName, scenarioData] of Object.entries(this.scenarios)) {
            const scenarioDiv = document.createElement('div');
            scenarioDiv.className = 'scenario-item';
            if (scenarioName === this.currentScenario) {
                scenarioDiv.classList.add('active');
            }

            const infoDiv = document.createElement('div');
            infoDiv.className = 'scenario-info';

            const nameDiv = document.createElement('div');
            nameDiv.className = 'scenario-name';
            nameDiv.textContent = scenarioName;

            const detailsDiv = document.createElement('div');
            detailsDiv.className = 'scenario-details';
            let usedDays = 0;
            for (const [date, isFullDay] of scenarioData.selectedDays) {
                usedDays += isFullDay ? 1 : 0.5;
            }
            const totalDays = Object.values(scenarioData.holidayDays).reduce((sum, days) => sum + days, 0);
            const remainingDays = totalDays - usedDays;
            const companyHolidaysCount = scenarioData.companyHolidays.length;
            const usedDaysText = usedDays % 1 === 0 ? usedDays : usedDays.toFixed(1);
            const totalDaysText = totalDays % 1 === 0 ? totalDays : totalDays.toFixed(1);
            detailsDiv.textContent = `${usedDaysText}/${totalDaysText} days used • ${companyHolidaysCount} company holidays`;

            infoDiv.appendChild(nameDiv);
            infoDiv.appendChild(detailsDiv);

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'scenario-actions';

            const loadBtn = document.createElement('button');
            loadBtn.className = 'btn btn-small btn-load';
            loadBtn.innerHTML = '<i class="fas fa-upload"></i> Load';
            loadBtn.addEventListener('click', () => {
                this.loadScenario(scenarioName);
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-small btn-delete';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.addEventListener('click', () => {
                this.deleteScenario(scenarioName);
            });

            actionsDiv.appendChild(loadBtn);
            actionsDiv.appendChild(deleteBtn);

            scenarioDiv.appendChild(infoDiv);
            scenarioDiv.appendChild(actionsDiv);
            scenariosDiv.appendChild(scenarioDiv);
        }
    }

    updateCurrentScenarioDisplay() {
        const currentScenarioDisplay = document.getElementById('currentScenarioName');
        currentScenarioDisplay.textContent = this.currentScenario;
    }

    saveScenario() {
        const scenarioNameInput = document.getElementById('scenarioName');
        const scenarioName = scenarioNameInput.value.trim();
        
        if (!scenarioName) {
            this.showNotification('Please enter a scenario name', 'error');
            return;
        }

        if (scenarioName === 'Default') {
            this.showNotification('Cannot use "Default" as scenario name', 'error');
            return;
        }

        // Check if scenario already exists
        if (this.scenarios[scenarioName]) {
            if (!confirm(`Scenario "${scenarioName}" already exists. Do you want to overwrite it?`)) {
                return;
            }
        }

        this.scenarios[scenarioName] = {
            holidayDays: {...this.holidayDays},
            selectedDays: Array.from(this.selectedDays.entries()),
            currentYear: this.currentYear,
            companyHolidays: [...this.companyHolidays],
            savedDate: new Date().toISOString()
        };

        this.currentScenario = scenarioName;
        scenarioNameInput.value = '';
        
        this.renderScenarios();
        this.updateCurrentScenarioDisplay();
        this.saveToStorage();
        this.showNotification(`Scenario "${scenarioName}" saved successfully!`, 'success');
    }

    loadDefaultScenario() {
        if (confirm('Are you sure you want to reset to default scenario? This will clear all current selections.')) {
            this.holidayDays = {
                daysFromLastYear: 0,
                loyaltyDays: 0,
                regularDays: 25,
                boughtDays: 0,
                bonusDays: 0
            };
            this.selectedDays.clear();
            this.companyHolidays = [];
            this.currentScenario = 'Default';
            
            // Update all input fields
            document.getElementById('daysFromLastYear').value = this.holidayDays.daysFromLastYear;
            document.getElementById('loyaltyDays').value = this.holidayDays.loyaltyDays;
            document.getElementById('regularDays').value = this.holidayDays.regularDays;
            document.getElementById('boughtDays').value = this.holidayDays.boughtDays;
            document.getElementById('bonusDays').value = this.holidayDays.bonusDays;
            
            this.updateTotalDays();
            this.renderCalendar();
            this.renderCompanyHolidays();
            this.renderScenarios();
            this.updateCurrentScenarioDisplay();
            this.updateStats();
            this.saveToStorage();
            this.showNotification('Reset to default scenario', 'success');
        }
    }

    loadScenario(scenarioName) {
        if (!this.scenarios[scenarioName]) {
            this.showNotification('Scenario not found', 'error');
            return;
        }

        const scenarioData = this.scenarios[scenarioName];
        
        this.holidayDays = {...scenarioData.holidayDays};
        this.selectedDays = new Map(scenarioData.selectedDays);
        this.currentYear = scenarioData.currentYear;
        this.companyHolidays = [...scenarioData.companyHolidays];
        this.currentScenario = scenarioName;

        // Update all input fields
        document.getElementById('daysFromLastYear').value = this.holidayDays.daysFromLastYear;
        document.getElementById('loyaltyDays').value = this.holidayDays.loyaltyDays;
        document.getElementById('regularDays').value = this.holidayDays.regularDays;
        document.getElementById('boughtDays').value = this.holidayDays.boughtDays;
        document.getElementById('bonusDays').value = this.holidayDays.bonusDays;
        
        this.updateTotalDays();
        this.updateYearDisplay();
        this.renderCalendar();
        this.renderCompanyHolidays();
        this.renderScenarios();
        this.updateCurrentScenarioDisplay();
        this.updateStats();
        this.saveToStorage();
        
        this.showNotification(`Scenario "${scenarioName}" loaded successfully!`, 'success');
    }

    deleteScenario(scenarioName) {
        if (confirm(`Are you sure you want to delete scenario "${scenarioName}"?`)) {
            delete this.scenarios[scenarioName];
            
            // If we're deleting the current scenario, reset to default
            if (this.currentScenario === scenarioName) {
                this.currentScenario = 'Default';
                this.updateCurrentScenarioDisplay();
            }
            
            this.renderScenarios();
            this.saveToStorage();
            this.showNotification(`Scenario "${scenarioName}" deleted`, 'success');
        }
    }

    exportScenarios() {
        if (Object.keys(this.scenarios).length === 0) {
            this.showNotification('No scenarios to export', 'error');
            return;
        }

        const exportData = {
            scenarios: this.scenarios,
            exportDate: new Date().toISOString(),
            version: '1.0',
            description: 'Holiday Planner Scenarios Export'
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `holiday-scenarios-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showNotification(`${Object.keys(this.scenarios).length} scenarios exported successfully!`, 'success');
    }

    importScenarios(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importData = JSON.parse(e.target.result);
                
                // Validate the import data
                if (!importData.scenarios || typeof importData.scenarios !== 'object') {
                    this.showNotification('Invalid scenario file format', 'error');
                    return;
                }

                // Count scenarios to import
                const scenarioCount = Object.keys(importData.scenarios).length;
                if (scenarioCount === 0) {
                    this.showNotification('No scenarios found in file', 'error');
                    return;
                }

                // Ask user about merge strategy
                const existingCount = Object.keys(this.scenarios).length;
                let shouldProceed = true;
                
                if (existingCount > 0) {
                    const message = `You have ${existingCount} existing scenarios. Import will add ${scenarioCount} new scenarios. Scenarios with the same name will be overwritten. Continue?`;
                    shouldProceed = confirm(message);
                }

                if (shouldProceed) {
                    // Import scenarios
                    let importedCount = 0;
                    let overwrittenCount = 0;

                    for (const [scenarioName, scenarioData] of Object.entries(importData.scenarios)) {
                        if (this.scenarios[scenarioName]) {
                            overwrittenCount++;
                        } else {
                            importedCount++;
                        }
                        this.scenarios[scenarioName] = scenarioData;
                    }

                    // Update UI and save
                    this.renderScenarios();
                    this.saveToStorage();

                    // Show success message
                    let message = `Successfully imported ${importedCount} new scenarios`;
                    if (overwrittenCount > 0) {
                        message += ` and updated ${overwrittenCount} existing scenarios`;
                    }
                    this.showNotification(message, 'success');
                }

            } catch (error) {
                console.error('Error importing scenarios:', error);
                this.showNotification('Error reading scenario file. Please check the file format.', 'error');
            }
        };

        reader.readAsText(file);
        
        // Reset the file input so the same file can be selected again
        event.target.value = '';
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HolidayPlanner();
});

// Add some helpful keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case 's':
                e.preventDefault();
                // Save is automatic, just show notification
                document.querySelector('.container').dispatchEvent(new CustomEvent('save'));
                break;
            case 'e':
                e.preventDefault();
                document.getElementById('exportData').click();
                break;
        }
    }
}); 