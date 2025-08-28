export class CookieHandler {
  async getCookiesForDomain(domain: string): Promise<chrome.cookies.Cookie[]> {
    try {
      console.log("Getting cookies for domain:", domain);

      const stores = await chrome.cookies.getAllCookieStores();
      const allCookies: chrome.cookies.Cookie[] = [];
      const currentDomain = domain.split(":")[0];

      for (const store of stores) {
        try {
          const cookies = await chrome.cookies.getAll({ storeId: store.id });
          const domainCookies = cookies.filter((cookie) => {
            const slicedCookieDomain = cookie.domain.startsWith(".") ? cookie.domain.slice(1) : cookie.domain;
            return (
              slicedCookieDomain === currentDomain ||
              slicedCookieDomain === `www.${currentDomain}` ||
              currentDomain.endsWith(slicedCookieDomain)
            );
          });
          allCookies.push(...domainCookies);
        } catch (storeError) {
          console.warn("Failed to get cookies from store:", store.id, storeError);
          // Continue with other stores
        }
      }

      console.log("Cookies retrieved successfully:", allCookies.length);
      return allCookies;
    } catch (error) {
      console.error("Error getting cookies for domain:", domain, error);
      return [];
    }
  }

  async clearCookiesForDomain(domain: string): Promise<void> {
    try {
      console.log("Clearing cookies for domain:", domain);

      const cookies = await this.getCookiesForDomain(domain);
      if (cookies.length === 0) {
        console.log("No cookies to clear");
        return;
      }

      const clearPromises = cookies.map(async (cookie) => {
        try {
          await chrome.cookies.remove({
            url: this.buildCookieUrl(cookie, domain),
            name: cookie.name,
            storeId: cookie.storeId,
          });
        } catch (error) {
          console.warn("Failed to remove cookie:", cookie.name, error);
        }
      });

      await Promise.all(clearPromises);
      console.log("Cookies cleared successfully");
    } catch (error) {
      console.error("Error clearing cookies for domain:", domain, error);
      // Don't throw error, just log it
    }
  }

  async restoreCookies(cookies: chrome.cookies.Cookie[], domain: string): Promise<void> {
    try {
      console.log("Restoring cookies for domain:", domain, "count:", cookies.length);

      if (cookies.length === 0) {
        console.log("No cookies to restore");
        return;
      }

      const restorePromises = cookies.map(async (cookie) => {
        try {
          const cookieDetails = this.prepareCookieForRestore(cookie, domain);
          await chrome.cookies.set(cookieDetails);
        } catch (error) {
          console.warn("Failed to restore cookie:", cookie.name, error);
        }
      });

      await Promise.all(restorePromises);
      console.log("Cookies restored successfully");
    } catch (error) {
      console.error("Error restoring cookies for domain:", domain, error);
      // Don't throw error, just log it
    }
  }

  private buildCookieUrl(cookie: chrome.cookies.Cookie, fallbackDomain?: string): string {
    try {
      const protocol = cookie.secure ? "https" : "http";
      let domain = cookie.domain;

      if (domain.startsWith(".")) {
        domain = domain.slice(1);
      }

      if (!domain && fallbackDomain) {
        domain = fallbackDomain;
      }

      if (!domain) {
        throw new Error(`Invalid domain for cookie ${cookie.name}: ${cookie.domain}`);
      }

      const path = cookie.path || "/";
      return `${protocol}://${domain}${path}`;
    } catch (error) {
      console.error("Error building cookie URL:", error);
      // Return a fallback URL
      return `http://${fallbackDomain || "localhost"}/`;
    }
  }

  private prepareCookieForRestore(cookie: chrome.cookies.Cookie, fallbackDomain: string): chrome.cookies.SetDetails {
    try {
      const url = this.buildCookieUrl(cookie, fallbackDomain);

      const cookieDetails: chrome.cookies.SetDetails = {
        url,
        name: cookie.name,
        value: cookie.value,
        path: cookie.path,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        storeId: cookie.storeId,
      };

      if (cookie.domain && cookie.domain.startsWith(".")) {
        cookieDetails.domain = cookie.domain;
      }

      if (!cookie.session && cookie.expirationDate) {
        cookieDetails.expirationDate = cookie.expirationDate;
      }

      if (cookie.sameSite && cookie.sameSite !== "unspecified") {
        cookieDetails.sameSite = cookie.sameSite;
      }

      return cookieDetails;
    } catch (error) {
      console.error("Error preparing cookie for restore:", error);
      // Return a basic cookie details object
      return {
        url: `http://${fallbackDomain}/`,
        name: cookie.name,
        value: cookie.value,
        path: "/",
        secure: false,
        httpOnly: false,
        storeId: cookie.storeId,
      };
    }
  }
}
