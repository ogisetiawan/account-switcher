// Extension functionality with performance optimizations
class SessionSwitcher {
    constructor() {
        this.currentSite = 'google';
        this.sessions = new Map();
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadSessions();
        this.setupKeyboardNavigation();
    }

    bindEvents() {
        // Use event delegation for better performance
        document.addEventListener('click', this.handleClick.bind(this));
        document.addEventListener('keydown', this.handleKeydown.bind(this));
        
        // Search functionality with debounce
        const searchInput = document.querySelector('[data-search="websites"]');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(this.handleSearch.bind(this), 300));
        }
    }

    handleClick(event) {
        const { action, site, email } = event.target.closest('[data-action], [data-site]')?.dataset || {};
        
        switch (action) {
            case 'add-session':
                this.addSession();
                break;
            case 'save-session':
                this.saveSession();
                break;
            case 'edit-session':
                this.editSession(email);
                break;
            case 'delete-session':
                this.deleteSession(email);
                break;
            case 'show-info':
                this.showInfo();
                break;
        }

        if (site) {
            this.switchSite(site);
        }
    }

    handleKeydown(event) {
        // Keyboard shortcuts
        if (event.ctrlKey || event.metaKey) {
            switch (event.key) {
                case 'k':
                    event.preventDefault();
                    document.querySelector('[data-search="websites"]').focus();
                    break;
                case 'n':
                    event.preventDefault();
                    this.addSession();
                    break;
            }
        }
    }

    setupKeyboardNavigation() {
        // Arrow key navigation for site buttons
        const siteButtons = document.querySelectorAll('[data-site]');
        siteButtons.forEach((button, index) => {
            button.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowRight') {
                    const next = siteButtons[index + 1] || siteButtons[0];
                    next.focus();
                } else if (e.key === 'ArrowLeft') {
                    const prev = siteButtons[index - 1] || siteButtons[siteButtons.length - 1];
                    prev.focus();
                }
            });
        });
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    async loadSessions() {
        try {
            const result = await chrome.storage.local.get(['sessions']);
            this.sessions = new Map(result.sessions || []);
            this.renderSessions();
        } catch (error) {
            console.error('Failed to load sessions:', error);
        }
    }

    async saveCurrentSession() {
        try {
            const sessions = Array.from(this.sessions.entries());
            await chrome.storage.local.set({ sessions });
        } catch (error) {
            console.error('Failed to save sessions:', error);
        }
    }

    switchSite(site) {
        // Remove active class from all site buttons
        document.querySelectorAll('[data-site]').forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-pressed', 'false');
        });

        // Add active class to selected site
        const selectedSite = document.querySelector(`[data-site="${site}"]`);
        if (selectedSite) {
            selectedSite.classList.add('active');
            selectedSite.setAttribute('aria-pressed', 'true');
        }

        this.currentSite = site;
        this.renderSessions();
    }

    renderSessions() {
        const sessionsContainer = document.querySelector('[role="list"]');
        const siteSessions = this.sessions.get(this.currentSite) || [];
        
        if (siteSessions.length === 0) {
            sessionsContainer.innerHTML = `
                <li class="text-center py-8 text-gray-500">
                    <span class="material-symbols-outlined text-4xl mb-2 block">account_circle</span>
                    <p>No saved sessions for ${this.currentSite}</p>
                    <button type="button" class="mt-2 text-blue-600 hover:text-blue-800" data-action="add-session">
                        Add your first session
                    </button>
                </li>
            `;
            return;
        }

        sessionsContainer.innerHTML = siteSessions.map((session, index) => `
            <li role="listitem">
                <article class="session-item ${session.active ? 'active' : ''} flex items-center justify-between bg-white/50 p-3 rounded-lg shadow-sm cursor-pointer transition-colors hover:bg-gray-100">
                    <div class="flex items-center flex-1 min-w-0">
                        <img 
                            src="${session.avatar || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNFNUU3RUIiLz4KPHBhdGggZD0iTTIwIDIwQzIyLjIwOTEgMjAgMjQgMTguMjA5MSAyNSAxNkMyNSAxMy43OTA5IDIyLjIwOTEgMTIgMjAgMTJDMTcuNzkwOSAxMiAxNiAxMy43OTA5IDE2IDE2QzE2IDE4LjIwOTEgMTcuNzkwOSAyMCAyMCAyMFpNMjAgMjJDMTYuNjg2MyAyMiAxNCAyNC42ODYzIDE0IDI4VjMwSDI2VjI4QzI2IDI0LjY4NjMgMjMuMzEzNyAyMiAyMCAyMloiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+'}"
                            alt="Profile picture for ${session.email}"
                            class="w-10 h-10 rounded-full mr-4"
                            loading="lazy"
                        />
                        <div class="min-w-0">
                            <h3 class="font-medium text-gray-800 truncate">${session.email}</h3>
                            <p class="text-sm text-gray-500">
                                <time datetime="${session.lastUsed}">Last used: ${this.formatLastUsed(session.lastUsed)}</time>
                                ${session.active ? '<span class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Active</span>' : ''}
                            </p>
                        </div>
                    </div>
                    <nav class="flex items-center space-x-1 ml-2" aria-label="Session actions">
                        <button type="button" class="p-2 rounded-full hover:bg-gray-200 focus-ring" aria-label="Edit ${session.email} session" data-action="edit-session" data-email="${session.email}">
                            <span class="material-symbols-outlined text-gray-600 text-base">edit</span>
                        </button>
                        <button type="button" class="p-2 rounded-full hover:bg-gray-200 focus-ring" aria-label="Delete ${session.email} session" data-action="delete-session" data-email="${session.email}">
                            <span class="material-symbols-outlined text-gray-600 text-base">delete</span>
                        </button>
                    </nav>
                </article>
            </li>
        `).join('');

        // Update session count
        document.getElementById('session-count').textContent = `${siteSessions.length} session${siteSessions.length !== 1 ? 's' : ''}`;
    }

    formatLastUsed(timestamp) {
        const now = new Date();
        const lastUsed = new Date(timestamp);
        const diffMs = now - lastUsed;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
        if (diffHours > 0) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        return 'Just now';
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new SessionSwitcher());
} else {
    new SessionSwitcher();
}
