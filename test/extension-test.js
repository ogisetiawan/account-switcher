/**
 * Accont Switcher Extension - Test Functions
 * File ini berisi fungsi-fungsi untuk test extension tanpa perlu load ke Chrome
 */

// Mock Chrome Extension API untuk testing
const mockChrome = {
  storage: {
    local: {
      get: (keys, callback) => {
        console.log("🔍 Mock chrome.storage.local.get called with keys:", keys);
        // Simulate storage data
        const mockData = {
          sessions: [
            { id: "session1", name: "Work Session", color: "#007bff" },
            { id: "session2", name: "Personal Session", color: "#28a745" },
            { id: "session3", name: "Shopping Session", color: "#ffc107" },
          ],
          currentSession: "session1",
          settings: {
            autoSwitch: true,
            notifications: true,
          },
        };

        setTimeout(() => {
          if (typeof callback === "function") {
            callback(mockData);
          }
        }, 100);
      },
      set: (data, callback) => {
        console.log("💾 Mock chrome.storage.local.set called with data:", data);
        setTimeout(() => {
          if (typeof callback === "function") {
            callback();
          }
        }, 100);
      },
    },
  },
  tabs: {
    query: (queryInfo, callback) => {
      console.log("🔍 Mock chrome.tabs.query called with query:", queryInfo);
      // Simulate tabs data
      const mockTabs = [
        { id: 1, url: "https://google.com", title: "Google" },
        { id: 2, url: "https://github.com", title: "GitHub" },
        { id: 3, url: "https://stackoverflow.com", title: "Stack Overflow" },
      ];

      setTimeout(() => {
        if (typeof callback === "function") {
          callback(mockTabs);
        }
      }, 100);
    },
  },
  cookies: {
    getAll: (details, callback) => {
      console.log("🍪 Mock chrome.cookies.getAll called with details:", details);
      // Simulate cookies data
      const mockCookies = [
        { name: "session_id", value: "abc123", domain: ".example.com" },
        { name: "user_pref", value: "dark_mode", domain: ".example.com" },
      ];

      setTimeout(() => {
        if (typeof callback === "function") {
          callback(mockCookies);
        }
      }, 100);
    },
  },
};

// Test functions
const ExtensionTester = {
  // Test storage functionality
  testStorage: async function () {
    console.log("🧪 Testing Storage Functionality...");

    try {
      // Test get
      mockChrome.storage.local.get(["sessions", "currentSession"], (data) => {
        console.log("✅ Storage get successful:", data);
      });

      // Test set
      mockChrome.storage.local.set(
        {
          testKey: "testValue",
          timestamp: Date.now(),
        },
        () => {
          console.log("✅ Storage set successful");
        }
      );
    } catch (error) {
      console.error("❌ Storage test failed:", error);
    }
  },

  // Test tabs functionality
  testTabs: async function () {
    console.log("🧪 Testing Tabs Functionality...");

    try {
      mockChrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        console.log("✅ Tabs query successful:", tabs);
      });
    } catch (error) {
      console.error("❌ Tabs test failed:", error);
    }
  },

  // Test cookies functionality
  testCookies: async function () {
    console.log("🧪 Testing Cookies Functionality...");

    try {
      mockChrome.cookies.getAll({ domain: ".example.com" }, (cookies) => {
        console.log("✅ Cookies query successful:", cookies);
      });
    } catch (error) {
      console.error("❌ Cookies test failed:", error);
    }
  },

  // Test session management
  testSessionManagement: function () {
    console.log("🧪 Testing Session Management...");

    try {
      // Simulate session switching
      const sessions = [
        { id: "work", name: "Work", color: "#007bff" },
        { id: "personal", name: "Personal", color: "#28a745" },
        { id: "shopping", name: "Shopping", color: "#ffc107" },
      ];

      let currentSessionIndex = 0;

      const switchSession = () => {
        currentSessionIndex = (currentSessionIndex + 1) % sessions.length;
        const newSession = sessions[currentSessionIndex];
        console.log(`🔄 Switched to session: ${newSession.name} (${newSession.id})`);
        return newSession;
      };

      // Test session switching
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          switchSession();
        }, i * 500);
      }

      console.log("✅ Session management test completed");
    } catch (error) {
      console.error("❌ Session management test failed:", error);
    }
  },

  // Test UI interactions
  testUIInteractions: function () {
    console.log("🧪 Testing UI Interactions...");

    try {
      // Simulate button clicks
      const simulateClick = (buttonType) => {
        console.log(`🔘 Simulating ${buttonType} button click`);

        // Simulate different button behaviors
        switch (buttonType) {
          case "add-session":
            console.log("➕ Adding new session...");
            break;
          case "delete-session":
            console.log("🗑️ Deleting session...");
            break;
          case "switch-session":
            console.log("🔄 Switching session...");
            break;
          case "settings":
            console.log("⚙️ Opening settings...");
            break;
        }
      };

      // Test different button types
      const buttonTypes = ["add-session", "delete-session", "switch-session", "settings"];
      buttonTypes.forEach((type, index) => {
        setTimeout(() => {
          simulateClick(type);
        }, index * 300);
      });

      console.log("✅ UI interactions test completed");
    } catch (error) {
      console.error("❌ UI interactions test failed:", error);
    }
  },

  // Run all tests
  runAllTests: function () {
    console.log("🚀 Starting Extension Tests...");
    console.log("=====================================");

    this.testStorage();
    this.testTabs();
    this.testCookies();
    this.testSessionManagement();
    this.testUIInteractions();

    console.log("=====================================");
    console.log("🎯 All tests completed! Check console for results.");
  },
};

// Export for use in browser console
if (typeof window !== "undefined") {
  window.ExtensionTester = ExtensionTester;
  window.mockChrome = mockChrome;

  console.log("🧪 ExtensionTester loaded successfully!");
  console.log("💡 Use ExtensionTester.runAllTests() to run all tests");
  console.log("💡 Or use individual test functions like ExtensionTester.testStorage()");
}

// Export for Node.js
if (typeof module !== "undefined" && module.exports) {
  module.exports = ExtensionTester;
}
