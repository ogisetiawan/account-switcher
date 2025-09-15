// Extension functionality with performance optimizations
class SessionSwitcher {
    constructor() {
    this.currentSite = "google";
        this.sessions = new Map();
    this.currentPage = "main"; // "main" atau "detail"
        this.init();
    }

    init() {
    this.initializeStaticData();
        this.bindEvents();
        this.loadSessions();
        this.setupKeyboardNavigation();
    this.showPage("main");
  }

  initializeStaticData() {
    // Data static untuk semua website dan session
    this.websites = {
      google: {
        name: "Google",
        icon: "https://lh3.googleusercontent.com/aida-public/AB6AXuA4Fr_j7xxpDjlUJODZQhdhMhpt0iBFaSeeWX5PbS5RvrMJOmWu6pnq_mJawxgQOdU57fqtE9_cE6sV8jTzbx6AERgUfmlKRDXghm8AN_MiqfRs-hGIK4eR3SA76VFz0C7DQPIXqP09RB0hIU41CWznWffiETw2LXo2kIqvnjiatdyJ95bSVcNL4FMSmUSZ-cjlZ1FJSuwwCumgK1umthEas1loAUBfU599emysE3-Qh2Wxcd5pACQoOGn63E8oBiLAeuyvwDOS-wu_",
        sessions: [
          {
            email: "personal@gmail.com",
            avatar: "../assets/img/account.png",
            lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            active: true
          },
          {
            email: "work@gmail.com",
            avatar: "../assets/img/account.png",
            lastUsed: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            active: false
          },
          {
            email: "business@gmail.com",
            avatar: "../assets/img/account.png",
            lastUsed: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            active: false
          }
        ]
      },
      facebook: {
        name: "Facebook",
        icon: "https://lh3.googleusercontent.com/aida-public/AB6AXuCmumCPVjbe93NYeH4NQsKwAmPmxwUwTD7AtVSsbjcWA_N3s3mO5yegS9V_vF6-C0PI0ZrB50-NPWnhjY2jWi663OxbIqYPapKWOsIVGBe9xQfhTSiOefNhcZ4edwaoQPR--Z_0J-Lzg6TwwHo5OOZciEb2vs-LqgovZ7osPP2Uz3vIgKTMhr6hncvpNnIlsl7L0wuVvX-8o_9IjXlqAaR_QPJXtpbU2Ek_Z-kT_IiExaFjjda3vkNFr06AQbVe9GFA_m4NZRjSN_fr",
        sessions: [
          {
            email: "john.doe@facebook.com",
            avatar: "../assets/img/account.png",
            lastUsed: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            active: true
          },
          {
            email: "jane.smith@facebook.com",
            avatar: "../assets/img/account.png",
            lastUsed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            active: false
          }
        ]
      },
      github: {
        name: "GitHub",
        icon: "https://lh3.googleusercontent.com/aida-public/AB6AXuDEq0rSIfUhoRwRESiTgGaF5Ph42dHN5h7XOVIrAt4UZnkHOGcQWVRlziGFLHdPWoQEnBGbANNP2TelXUSrDlyxK9-z20RWmrnSzWNxzOlHPi0WsBqGWm5cfrbhNPHnAmKkpbLZWnVEaLTYqBMBbzGcn6rDPIRo2SCMIyCv7ZT34jiFggZSOkWSuSEDmEt_bP8z2R7e6-ckyrEVrWlI6LHs5CNcuOw7XGBINpNWV3MVlhhRYwQTZb6ta9F2QaZ9XeC1dSHlxqju8tes",
        sessions: [
          {
            email: "developer@github.com",
            avatar: "../assets/img/account.png",
            lastUsed: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            active: true
          },
          {
            email: "open.source@github.com",
            avatar: "../assets/img/account.png",
            lastUsed: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            active: false
          },
          {
            email: "work.projects@github.com",
            avatar: "../assets/img/account.png",
            lastUsed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            active: false
          }
        ]
      },
      twitter: {
        name: "Twitter",
        icon: "https://lh3.googleusercontent.com/aida-public/AB6AXuD9IiMOTFozXrCUeHdd97c8Echlnnc2du0LpM4jD7ssk1DninXsEM6J5jE_wEc0qyn85fWlN9gxDrJQC9tgSsAmBtItAleW9Bc6lJxX4wJeKTXxET-sBsB_iLzs-_Ydlrk1SbmxtBB54ptmgB5Mf9mrw2lO3dkUqyOngYEq_nl-pifmr0cUp_YqpflXuuLsFooXBcTSnRPl1XIAvSgWVGLLL6LGTtAOzIENL-RUDg4gvQoeH1tINXldzze8mKjsg67PRnwVaIOZb0U1",
        sessions: [
          {
            email: "personal@twitter.com",
            avatar: "../assets/img/account.png",
            lastUsed: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            active: true
          }
        ]
      },
      discord: {
        name: "Discord",
        icon: "https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png",
        sessions: [
          {
            email: "gamer@discord.com",
            avatar: "../assets/img/account.png",
            lastUsed: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            active: true
          },
          {
            email: "community@discord.com",
            avatar: "../assets/img/account.png",
            lastUsed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            active: false
          }
        ]
      },
      notion: {
        name: "Notion",
        icon: "https://www.notion.so/images/logo-ios.png",
        sessions: [
          {
            email: "productivity@notion.com",
            avatar: "../assets/img/account.png",
            lastUsed: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
            active: true
          }
        ]
      },
      figma: {
        name: "Figma",
        icon: "https://cdn4.iconfinder.com/data/icons/logos-brands-in-colors/3000/figma-logo-512.png",
        sessions: [
          {
            email: "designer@figma.com",
            avatar: "../assets/img/account.png",
            lastUsed: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            active: true
          },
          {
            email: "team@figma.com",
            avatar: "../assets/img/account.png",
            lastUsed: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
            active: false
          }
        ]
      },
      trello: {
        name: "Trello",
        icon: "https://cdn2.iconfinder.com/data/icons/social-icons-33/128/Trello-512.png",
        sessions: [
          {
            email: "project.manager@trello.com",
            avatar: "../assets/img/account.png",
            lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            active: true
          }
        ]
      },
      linkedin: {
        name: "LinkedIn",
        icon: "https://content.linkedin.com/content/dam/me/business/en-us/amp/brand-site/v2/bg/LI-Bug.svg.original.svg",
        sessions: [
          {
            email: "professional@linkedin.com",
            avatar: "../assets/img/account.png",
            lastUsed: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            active: true
          },
          {
            email: "networking@linkedin.com",
            avatar: "../assets/img/account.png",
            lastUsed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            active: false
          }
        ]
      },
      instagram: {
        name: "Instagram",
        icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Instagram_icon.png/600px-Instagram_icon.png",
        sessions: [
          {
            email: "personal@instagram.com",
            avatar: "../assets/img/account.png",
            lastUsed: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            active: true
          }
        ]
      },
      youtube: {
        name: "YouTube",
        icon: "https://www.youtube.com/img/desktop/yt_1200.png",
        sessions: [
          {
            email: "creator@youtube.com",
            avatar: "../assets/img/account.png",
            lastUsed: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
            active: true
          },
          {
            email: "viewer@youtube.com",
            avatar: "../assets/img/account.png",
            lastUsed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            active: false
          }
        ]
      },
      slack: {
        name: "Slack",
        icon: "https://a.slack-edge.com/80588/marketing/img/icons/icon_slack_hash_colored.png",
        sessions: [
          {
            email: "team@slack.com",
            avatar: "../assets/img/account.png",
            lastUsed: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            active: true
          },
          {
            email: "project@slack.com",
            avatar: "../assets/img/account.png",
            lastUsed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            active: false
          }
        ]
      }
    };
    }

    bindEvents() {
        // Use event delegation for better performance
    document.addEventListener("click", this.handleClick.bind(this));
    document.addEventListener("keydown", this.handleKeydown.bind(this));
        
        // Search functionality with debounce
    const searchInput = document.querySelector("[data-search=\"websites\"]");
        if (searchInput) {
      searchInput.addEventListener("input", this.debounce(this.handleSearch.bind(this), 300));
        }
    }

    handleClick(event) {
    const { action, site, email } = event.target.closest("[data-action], [data-site]")?.dataset || {};
        
        switch (action) {
    case "add-session":
                this.addSession();
                break;
    case "save-session":
                this.saveSession();
                break;
    case "edit-session":
                this.editSession(email);
                break;
    case "delete-session":
                this.deleteSession(email);
                break;
    case "back-to-main":
      this.showPage("main");
      break;
    case "show-info":
                this.showInfo();
                break;
        }

        if (site) {
      this.navigateToDetail(site);
        }
    }

    handleKeydown(event) {
        // Keyboard shortcuts
        if (event.ctrlKey || event.metaKey) {
            switch (event.key) {
      case "k":
                    event.preventDefault();
        document.querySelector("[data-search=\"websites\"]").focus();
                    break;
      case "n":
                    event.preventDefault();
                    this.addSession();
                    break;
            }
        }
    }

    setupKeyboardNavigation() {
        // Arrow key navigation for site buttons
    const siteButtons = document.querySelectorAll("[data-site]");
        siteButtons.forEach((button, index) => {
      button.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight") {
                    const next = siteButtons[index + 1] || siteButtons[0];
                    next.focus();
        } else if (e.key === "ArrowLeft") {
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

  // Fungsi navigasi antar halaman
  showPage(page) {
    const mainPage = document.getElementById("main-page");
    const detailPage = document.getElementById("detail-page");

    if (page === "main") {
      mainPage.classList.remove("hidden");
      detailPage.classList.add("hidden");
      this.currentPage = "main";
    } else if (page === "detail") {
      mainPage.classList.add("hidden");
      detailPage.classList.remove("hidden");
      this.currentPage = "detail";
    }
  }

  navigateToDetail(site) {
    if (this.websites[site]) {
      this.currentSite = site;
      this.updateDetailPage(site);
      this.showPage("detail");
    }
  }

  updateDetailPage(site) {
    const website = this.websites[site];
    if (!website) return;

    // Update header detail page
    const detailSiteIcon = document.getElementById("detail-site-icon");
    const detailSiteName = document.getElementById("detail-site-name");
    const detailSiteTitle = document.getElementById("detail-site-title");

    if (detailSiteIcon) detailSiteIcon.src = website.icon;
    if (detailSiteIcon) detailSiteIcon.alt = website.name;
    if (detailSiteName) detailSiteName.textContent = website.name;
    if (detailSiteTitle) detailSiteTitle.textContent = website.name;

    // Render sessions untuk website yang dipilih
    this.renderDetailSessions(website.sessions);
  }

  renderDetailSessions(sessions) {
    const sessionsList = document.getElementById("sessions-list");
    const sessionCount = document.getElementById("session-count");

    if (!sessionsList) return;

    if (sessions.length === 0) {
      sessionsList.innerHTML = `
                <li class="text-center py-8 text-gray-500">
                    <span class="material-symbols-rounded text-4xl mb-2 block">account_circle</span>
          <p>No saved sessions for this website</p>
                    <button type="button" class="mt-2 text-blue-600 hover:text-blue-800" data-action="add-session">
                        Add your first session
                    </button>
                </li>
            `;
    } else {
      sessionsList.innerHTML = sessions.map(session => `
            <li role="listitem">
          <article class="session-item ${session.active ? "active" : ""} flex items-center justify-between bg-white/50 p-3 rounded-lg shadow-sm cursor-pointer transition-colors hover:bg-orange-50">
                    <div class="flex items-center flex-1 min-w-0">
                        <img 
                src="${session.avatar || "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNFNUU3RUIiLz4KPHBhdGggZD0iTTIwIDIwQzIyLjIwOTEgMjAgMjQgMTguMjA5MSAyNSAxNkMyNSAxMy43OTA5IDIyLjIwOTEgMTIgMjAgMTJDMTcuNzkwOSAxMiAxNiAxMy43OTA5IDE2IDE2QzE2IDE4LjIwOTEgMTcuNzkwOSAyMCAyMCAyMFpNMjAgMjJDMTYuNjg2MyAyMiAxNCAyNC42ODYzIDE0IDI4VjMwSDI2VjI4QzI2IDI0LjY4NjMgMjMuMzEzNyAyMiAyMCAyMloiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+"}"
                            alt="Profile picture for ${session.email}"
                            class="w-10 h-10 rounded-full mr-4"
                            loading="lazy"
                        />
                        <div class="min-w-0">
                            <h3 class="font-medium text-gray-800 truncate">${session.email}</h3>
                            <p class="text-sm text-gray-500">
                                <time datetime="${session.lastUsed}">Last used: ${this.formatLastUsed(session.lastUsed)}</time>
                  ${session.active ? "<span class=\"ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-300 text-orange-800\">Active</span>" : ""}
                            </p>
                        </div>
                    </div>
                    <nav class="flex items-center space-x-1 ml-2" aria-label="Session actions">
              <button
                type="button"
                class="p-2 rounded-none hover:bg-gray-200 hover:shadow-md focus-ring"
                aria-label="Edit ${session.email} session"
                data-action="edit-session"
                data-email="${session.email}"
              >
                <span class="pt-2 material-symbols-rounded text-gray-600" aria-hidden="true">edit</span>
                        </button>
              <button
                type="button"
                class="p-2 rounded-none hover:bg-gray-200 hover:shadow-md focus-ring"
                aria-label="Delete ${session.email} session"
                data-action="delete-session"
                data-email="${session.email}"
              >
                <span class="pt-2 material-symbols-rounded text-gray-600" aria-hidden="true">delete</span>
                        </button>
                    </nav>
                </article>
            </li>
      `).join("");
    }

        // Update session count
    if (sessionCount) {
      sessionCount.textContent = `${sessions.length} session${sessions.length !== 1 ? "s" : ""}`;
    }
  }

  async loadSessions() {
    try {
      const result = await chrome.storage.local.get(["sessions"]);
      this.sessions = new Map(result.sessions || []);
      // Tidak perlu render sessions di sini karena akan di-render di detail page
    } catch (error) {
      console.error("Failed to load sessions:", error);
    }
  }

  async saveCurrentSession() {
    try {
      const sessions = Array.from(this.sessions.entries());
      await chrome.storage.local.set({ sessions });
    } catch (error) {
      console.error("Failed to save sessions:", error);
    }
  }

  // Fungsi-fungsi untuk session management
  addSession() {
    console.log("Add session clicked");
    // Implementasi add session
  }

  saveSession() {
    console.log("Save session clicked");
    // Implementasi save session
  }

  editSession(email) {
    console.log("Edit session clicked for:", email);
    // Implementasi edit session
  }

  deleteSession(email) {
    console.log("Delete session clicked for:", email);
    // Implementasi delete session
  }

  showInfo() {
    console.log("Show info clicked");
    // Implementasi show info
    }

    formatLastUsed(timestamp) {
        const now = new Date();
        const lastUsed = new Date(timestamp);
        const diffMs = now - lastUsed;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    return "Just now";
    }
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => new SessionSwitcher());
} else {
    new SessionSwitcher();
}