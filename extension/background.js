// Socialora Background Service Worker
// Owns Instagram tab lifecycle, cookie polling and session verification.
// Also exposes legacy helpers used by popup/content scripts.

// Import config
importScripts("config.js");

// ---------------------------------------------------------------------------
// Helper: build API URL
// ---------------------------------------------------------------------------

function buildApiUrl(baseUrl, path) {
  const cleanBase = baseUrl.replace(/\/+$/, "");
  const cleanPath = path.replace(/^\/+/, "");
  return `${cleanBase}/${cleanPath}`;
}

// ---------------------------------------------------------------------------
// Cookie helpers
// ---------------------------------------------------------------------------

async function getInstagramCookies() {
  const cookies = await chrome.cookies.getAll({ domain: "instagram.com" });

  const cookieMap = {};
  cookies.forEach((cookie) => {
    cookieMap[cookie.name] = cookie.value;
  });

  return {
    sessionId: cookieMap.sessionid || "",
    csrfToken: cookieMap.csrftoken || "",
    dsUserId: cookieMap.ds_user_id || "",
    mid: cookieMap.mid || "",
    igDid: cookieMap.ig_did || "",
    rur: cookieMap.rur || "",
  };
}

async function verifySession(cookies) {
  try {
    const config = await CONFIG.getCurrent();
    const url = buildApiUrl(config.BACKEND_URL, "api/instagram/cookie/verify");

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cookies }),
    });

    const contentType = response.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");

    if (!isJson) {
      const text = await response.text();
      console.error(
        "Server returned non-JSON response:",
        text.substring(0, 200)
      );
      return {
        success: false,
        error: `Server error (${response.status}). The backend may be experiencing issues.`,
      };
    }

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || `Server error: ${response.status}`,
      };
    }

    return data;
  } catch (error) {
    console.error("Verify session error:", error);

    if (error instanceof SyntaxError && error.message.includes("JSON")) {
      return {
        success: false,
        error:
          "Server returned invalid response. The backend may be down or experiencing issues.",
      };
    }

    return {
      success: false,
      error: error.message || "Failed to connect to backend",
    };
  }
}

// ---------------------------------------------------------------------------
// Instagram connection orchestration
// ---------------------------------------------------------------------------

async function startInstagramConnection() {
  try {
    // Check if there's already a stored Instagram tab
    const storedState = await new Promise((resolve) => {
      chrome.storage.local.get(["socialora_instagram_tab_id"], (data) =>
        resolve(data)
      );
    });

    let instagramTabId = null;
    let tab = null;

    // If there's a stored tab ID, try to reuse it
    if (storedState.socialora_instagram_tab_id) {
      try {
        const existingTab = await chrome.tabs.get(
          storedState.socialora_instagram_tab_id
        );
        // Check if the tab is still valid and is an Instagram tab
        if (
          existingTab &&
          existingTab.url &&
          (existingTab.url.includes("instagram.com") ||
            existingTab.url.includes("www.instagram.com"))
        ) {
          // Reuse the existing tab
          tab = existingTab;
          instagramTabId = existingTab.id;
          // Optionally activate the tab
          await chrome.tabs.update(instagramTabId, { active: false });
        }
      } catch (e) {
        // Tab doesn't exist or is invalid, will create a new one
        console.log("Stored tab no longer exists, creating new tab");
      }
    }

    // If no valid tab was found, create a new one
    if (!tab) {
      tab = await chrome.tabs.create({
        url: "https://www.instagram.com/",
        // Open login tab in the background to avoid stealing focus
        active: false,
      });
      instagramTabId = tab.id;
    }

    chrome.storage.local.set({
      socialora_instagram_tab_id: instagramTabId,
      socialora_connection_state: "connecting",
    });

    chrome.runtime.sendMessage(
      {
        type: "CONNECTION_STATUS",
        state: "connecting",
      },
      () => {
        if (chrome.runtime.lastError) {
          // Popup might not be open, ignore the error
          console.log(
            "No receiver for CONNECTION_STATUS message (popup may be closed)"
          );
        }
      }
    );

    pollForInstagramLogin(instagramTabId);

    return { success: true };
  } catch (error) {
    console.error("Failed to start Instagram connection:", error);
    return {
      success: false,
      error: error.message || "Failed to open Instagram tab",
    };
  }
}

async function stopInstagramConnection() {
  const state = await new Promise((resolve) => {
    chrome.storage.local.get(
      [
        "socialora_instagram_tab_id",
        "socialora_connection_state",
        "socialora_connected_user",
      ],
      (data) => resolve(data)
    );
  });

  const tabId = state.socialora_instagram_tab_id;
  const connectedUser = state.socialora_connected_user || null;

  // Close only the associated Instagram tab if it exists
  if (tabId) {
    try {
      await chrome.tabs.remove(tabId);
    } catch (e) {
      // Tab may already be closed; ignore
    }
  }

  // Keep connection state if user was connected - don't reset to idle
  const newState = connectedUser ? "connected" : "idle";

  chrome.storage.local.set({
    socialora_instagram_tab_id: null, // Clear tab ID but keep connection
    socialora_connection_state: newState,
    // Keep socialora_connected_user unchanged
  });

  chrome.runtime.sendMessage(
    {
      type: "CONNECTION_STATUS",
      state: newState,
      user: connectedUser,
      tabClosed: true, // Indicate tab was closed
    },
    () => {
      if (chrome.runtime.lastError) {
        // Popup might not be open, ignore the error
        console.log(
          "No receiver for CONNECTION_STATUS message (popup may be closed)"
        );
      }
    }
  );

  return { success: true, state: newState, user: connectedUser };
}

function pollForInstagramLogin(instagramTabId) {
  const maxAttempts = 150; // ~5 minutes at 2s
  let attempts = 0;

  const intervalId = setInterval(async () => {
    attempts += 1;

    try {
      const tab = await chrome.tabs.get(instagramTabId);
      if (!tab) {
        clearInterval(intervalId);
        return;
      }
    } catch {
      clearInterval(intervalId);
      return;
    }

    const cookies = await getInstagramCookies();

    if (cookies.sessionId && cookies.dsUserId) {
      clearInterval(intervalId);
      handleCookiesReady(cookies).catch((err) => {
        console.error("Failed to handle cookies:", err);
        chrome.runtime.sendMessage(
          {
            type: "CONNECTION_STATUS",
            state: "idle",
            error: err.message || "Failed to verify Instagram session",
          },
          () => {
            if (chrome.runtime.lastError) {
              // Popup might not be open, ignore the error
              console.log(
                "No receiver for CONNECTION_STATUS message (popup may be closed)"
              );
            }
          }
        );
        chrome.storage.local.set({
          socialora_connection_state: "idle",
        });
      });
      return;
    }

    if (attempts >= maxAttempts) {
      clearInterval(intervalId);
      chrome.runtime.sendMessage(
        {
          type: "CONNECTION_STATUS",
          state: "idle",
          error: "Login timeout. Please try again.",
        },
        () => {
          if (chrome.runtime.lastError) {
            // Popup might not be open, ignore the error
            console.log(
              "No receiver for CONNECTION_STATUS message (popup may be closed)"
            );
          }
        }
      );
      chrome.storage.local.set({
        socialora_connection_state: "idle",
      });
    }
  }, 2000);
}

async function handleCookiesReady(cookies) {
  const verifyResult = await verifySession(cookies);
  if (!verifyResult || !verifyResult.success) {
    throw new Error(
      verifyResult?.error ||
        verifyResult?.message ||
        "Session verification failed"
    );
  }

  const user = verifyResult.user;
  const storageKey = `socialora_cookies_${user.pk}`;

  await new Promise((resolve) => {
    chrome.storage.local.set({ [storageKey]: cookies }, resolve);
  });

  // Check if Instagram tab is still open
  const storedState = await new Promise((resolve) => {
    chrome.storage.local.get(["socialora_instagram_tab_id"], (data) =>
      resolve(data)
    );
  });

  let tabOpen = false;
  let tabId = storedState.socialora_instagram_tab_id || null;

  if (tabId) {
    try {
      const tab = await chrome.tabs.get(tabId);
      if (
        tab &&
        tab.url &&
        (tab.url.includes("instagram.com") ||
          tab.url.includes("www.instagram.com"))
      ) {
        tabOpen = true;
      }
    } catch (e) {
      // Tab doesn't exist or is invalid
      tabId = null;
    }
  }

  chrome.storage.local.set({
    socialora_connection_state: "connected",
    socialora_connected_user: user,
    socialora_instagram_tab_id: tabId, // Keep tab ID if tab is open
  });

  chrome.runtime.sendMessage(
    {
      type: "CONNECTION_COMPLETE",
      user,
      tabOpen,
      tabId,
    },
    () => {
      if (chrome.runtime.lastError) {
        // Popup might not be open, ignore the error
        console.log(
          "No receiver for CONNECTION_COMPLETE message (popup may be closed)"
        );
      }
    }
  );

  // Open Socialora app and transfer cookies using existing content-script flow
  const config = await CONFIG.getCurrent();
  const cleanAppUrl = config.APP_URL.replace(/\/+$/, "");
  const accountMetadata = {
    igUserId: user.pk,
    username: user.username,
    fullName: user.fullName,
    profilePicUrl: user.profilePicUrl,
  };
  const encodedMetadata = btoa(JSON.stringify(accountMetadata));
  const redirectUrl = `${cleanAppUrl}/settings/instagram?ig_user_id=${user.pk}&account=${encodedMetadata}`;

  // Prefer reusing an existing app tab if one is already open
  chrome.tabs.query({ url: [`${cleanAppUrl}/*`] }, (tabs) => {
    const targetTab = tabs && tabs.length > 0 ? tabs[0] : null;

    const openOrUpdate = (cb) => {
      if (targetTab && targetTab.id != null) {
        chrome.tabs.update(
          targetTab.id,
          { url: redirectUrl, active: true },
          (updated) => {
            cb(updated);
          }
        );
      } else {
        chrome.tabs.create({ url: redirectUrl, active: true }, (created) => {
          cb(created);
        });
      }
    };

    openOrUpdate((tab) => {
      if (!tab || !tab.id) return;
      const tabId = tab.id;

      const sendCookiesToPage = (tabId, retryCount = 0) => {
        const maxRetries = 10;
        const retryDelay = 300;

        chrome.tabs.sendMessage(
          tabId,
          {
            type: "SAVE_COOKIES",
            userId: user.pk,
            cookies,
          },
          (response) => {
            if (chrome.runtime.lastError) {
              if (retryCount < maxRetries) {
                setTimeout(
                  () => sendCookiesToPage(tabId, retryCount + 1),
                  retryDelay
                );
              } else {
                injectCookiesViaScript(tabId);
              }
            } else if (!response || !response.success) {
              injectCookiesViaScript(tabId);
            }
          }
        );
      };

      const injectCookiesViaScript = (tabId) => {
        chrome.scripting
          .executeScript({
            target: { tabId },
            func: (userId, cookieData) => {
              const storageKey = "socialora_cookies_" + userId;
              try {
                const cookiesJson = JSON.stringify(cookieData);
                localStorage.setItem(storageKey, cookiesJson);
                sessionStorage.setItem(storageKey, cookiesJson);
                window.dispatchEvent(
                  new CustomEvent("socialora_cookies_saved", {
                    detail: { userId, storageKey, cookies: cookieData },
                  })
                );
                window.postMessage(
                  {
                    type: "SOCIALORA_COOKIES_SAVED",
                    userId,
                    cookies: cookieData,
                    storageKey,
                  },
                  window.location.origin
                );
                return { success: true, storageKey };
              } catch (e) {
                return { success: false, error: e.message };
              }
            },
            args: [user.pk, cookies],
          })
          .catch(() => {
            // Best-effort; if this fails the page can still request cookies via content script.
          });
      };

      const listener = (updatedTabId, changeInfo) => {
        if (updatedTabId === tabId && changeInfo.status === "complete") {
          sendCookiesToPage(tabId);
          chrome.tabs.onUpdated.removeListener(listener);
        }
      };

      chrome.tabs.onUpdated.addListener(listener);
    });
  });
}

// ---------------------------------------------------------------------------
// Message router
// ---------------------------------------------------------------------------

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Legacy helpers used by content script / popup
  if (message.type === "GET_COOKIES") {
    getInstagramCookies().then(sendResponse);
    return true;
  }

  if (message.type === "VERIFY_SESSION") {
    verifySession(message.cookies).then(sendResponse);
    return true;
  }

  if (message.type === "GET_STORED_COOKIES") {
    const userId = message.userId;
    const storageKey = `socialora_cookies_${userId}`;
    chrome.storage.local.get([storageKey], (result) => {
      sendResponse({ success: true, cookies: result[storageKey] || null });
    });
    return true;
  }

  if (message.type === "CONTENT_SCRIPT_READY" && sender.tab) {
    console.log("Background: Content script ready for tab", sender.tab.id);
    sendResponse({ success: true });
    return false;
  }

  // New orchestration messages from popup
  if (message.type === "START_CONNECTION") {
    startInstagramConnection().then(sendResponse);
    return true;
  }

  if (message.type === "STOP_CONNECTION") {
    stopInstagramConnection().then(sendResponse);
    return true;
  }

  // Job queue control messages
  if (message.type === "START_JOB_QUEUE") {
    startJobQueuePoller();
    sendResponse({ success: true });
    return false;
  }

  if (message.type === "STOP_JOB_QUEUE") {
    stopJobQueuePoller();
    sendResponse({ success: true });
    return false;
  }

  if (message.type === "PROCESS_JOBS_NOW") {
    processJobQueue()
      .then(() => {
        sendResponse({ success: true });
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  if (message.type === "GET_PENDING_JOBS_COUNT") {
    getPendingJobsCount()
      .then((count) => {
        sendResponse({ success: true, count });
      })
      .catch((error) => {
        sendResponse({ success: false, count: 0, error: error.message });
      });
    return true;
  }

  if (message.type === "GET_JOB_QUEUE_STATUS") {
    const status = {
      isRunning: jobQueueInterval !== null,
      isProcessing: isProcessingJobs,
    };
    sendResponse({ success: true, status });
    return false;
  }

  // Send DM message handler
  if (message.type === "SEND_DM") {
    sendDM({
      recipientUsername: message.recipientUsername,
      message: message.message,
      accountId: message.accountId,
    })
      .then((result) => {
        sendResponse(result);
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  // Forward SAVE_COOKIES messages from popup to content script (legacy path)
  if (message.type === "FORWARD_SAVE_COOKIES" && sender.tab) {
    chrome.tabs.sendMessage(
      sender.tab.id,
      {
        type: "SAVE_COOKIES",
        userId: message.userId,
        cookies: message.cookies,
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error(
            "Background: Failed to forward message:",
            chrome.runtime.lastError
          );
          sendResponse({
            success: false,
            error: chrome.runtime.lastError.message,
          });
        } else {
          sendResponse(response);
        }
      }
    );
    return true;
  }

  return false;
});

// ---------------------------------------------------------------------------
// Job Queue Polling System
// ---------------------------------------------------------------------------

let jobQueueInterval = null;
let isProcessingJobs = false;

/**
 * Start the job queue poller that runs every minute
 */
async function startJobQueuePoller() {
  if (jobQueueInterval) {
    console.log("Job queue poller already running");
    return;
  }

  console.log("Starting job queue poller...");

  // Run immediately on start
  await processJobQueue();

  // Then run every minute (60000ms)
  jobQueueInterval = setInterval(async () => {
    await processJobQueue();
  }, 60000);
}

/**
 * Stop the job queue poller
 */
function stopJobQueuePoller() {
  if (jobQueueInterval) {
    clearInterval(jobQueueInterval);
    jobQueueInterval = null;
    console.log("Job queue poller stopped");
  }
}

/**
 * Main job queue processor
 * Fetches pending jobs from the backend and processes them
 */
async function processJobQueue() {
  // Prevent concurrent processing
  if (isProcessingJobs) {
    console.log("Job processing already in progress, skipping...");
    return;
  }

  try {
    isProcessingJobs = true;

    // Check if we have a connected Instagram account
    const state = await new Promise((resolve) => {
      chrome.storage.local.get(
        ["socialora_connection_state", "socialora_connected_user"],
        (data) => resolve(data)
      );
    });

    if (
      state.socialora_connection_state !== "connected" ||
      !state.socialora_connected_user
    ) {
      console.log(
        "No Instagram account connected, skipping job queue processing"
      );
      return;
    }

    const connectedUser = state.socialora_connected_user;
    const config = await CONFIG.getCurrent();

    // Fetch pending jobs from backend
    const jobsUrl = buildApiUrl(
      config.BACKEND_URL,
      `api/campaigns/jobs?ig_user_id=${connectedUser.pk}`
    );

    const response = await fetch(jobsUrl, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      console.error("Failed to fetch jobs:", response.status);
      return;
    }

    const data = await response.json();
    const jobs = data.jobs || [];

    if (jobs.length === 0) {
      console.log("No pending jobs to process");
      return;
    }

    console.log(`Processing ${jobs.length} pending job(s)...`);

    // Process each job
    for (const job of jobs) {
      try {
        await processJob(job, connectedUser, config);
      } catch (error) {
        console.error(`Failed to process job ${job.id}:`, error);

        // Report job failure to backend
        await reportJobStatus(job.id, "FAILED", error.message, config);
      }
    }
  } catch (error) {
    console.error("Error in job queue processing:", error);
  } finally {
    isProcessingJobs = false;
  }
}

/**
 * Send DM via backend API
 * @param {Object} params - DM parameters
 * @param {string} params.recipientUsername - Instagram username to send DM to
 * @param {string} params.message - Message content
 * @param {string} [params.accountId] - Optional Instagram account ID for tracking
 * @returns {Promise<Object>} Result object with success status and details
 */
async function sendDM({ recipientUsername, message, accountId }) {
  try {
    // Get connected Instagram account and cookies
    const state = await new Promise((resolve) => {
      chrome.storage.local.get(
        ["socialora_connection_state", "socialora_connected_user"],
        (data) => resolve(data)
      );
    });

    if (
      state.socialora_connection_state !== "connected" ||
      !state.socialora_connected_user
    ) {
      return {
        success: false,
        error:
          "No Instagram account connected. Please connect your account first.",
      };
    }

    const connectedUser = state.socialora_connected_user;
    const storageKey = `socialora_cookies_${connectedUser.pk}`;

    const storedData = await new Promise((resolve) => {
      chrome.storage.local.get([storageKey], (result) => {
        resolve(result);
      });
    });

    const cookies = storedData[storageKey];
    if (!cookies || !cookies.sessionId) {
      return {
        success: false,
        error:
          "No valid cookies found. Please reconnect your Instagram account.",
      };
    }

    // Verify session is still valid
    const verifyResult = await verifySession(cookies);
    if (!verifyResult || !verifyResult.success) {
      return {
        success: false,
        error: "Instagram session expired. Please reconnect your account.",
      };
    }

    // Send DM via backend API
    const config = await CONFIG.getCurrent();
    const sendUrl = buildApiUrl(
      config.BACKEND_URL,
      "api/instagram/cookie/dm/send"
    );

    const response = await fetch(sendUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cookies: cookies,
        recipientUsername: recipientUsername,
        message: message,
        accountId: accountId || connectedUser.pk,
      }),
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Failed to send DM" }));
      return {
        success: false,
        error: errorData.error || errorData.message || "Failed to send DM",
      };
    }

    const result = await response.json();

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Failed to send DM",
      };
    }

    console.log(`✓ DM sent successfully to @${recipientUsername}`);

    return {
      success: true,
      threadId: result.threadId,
      itemId: result.itemId,
      recipient: recipientUsername,
    };
  } catch (error) {
    console.error("Error in sendDM:", error);
    return {
      success: false,
      error: error.message || "Failed to send DM",
    };
  }
}

/**
 * Process a single job (send DM)
 * @param {Object} job - Job object containing recipient, message, and campaign details
 * @param {Object} connectedUser - Connected Instagram user
 * @param {Object} config - Extension config
 */
async function processJob(job, connectedUser, config) {
  console.log(
    `Processing job ${job.id} for recipient ${job.recipientUsername}`
  );

  // Use the sendDM helper function
  const result = await sendDM({
    recipientUsername: job.recipientUsername,
    message: job.message,
    accountId: job.accountId || connectedUser.pk,
  });

  if (!result.success) {
    throw new Error(result.error);
  }

  console.log(`Successfully sent DM for job ${job.id}:`, result);

  // Report success to backend
  await reportJobStatus(job.id, "SENT", null, config);
}

/**
 * Report job status back to backend
 * @param {string} jobId - Job/recipient ID
 * @param {string} status - Job status (SENT, FAILED, etc.)
 * @param {string|null} error - Error message if failed
 * @param {Object} config - Extension config
 */
async function reportJobStatus(jobId, status, error, config) {
  try {
    const statusUrl = buildApiUrl(
      config.BACKEND_URL,
      "api/campaigns/jobs/status"
    );

    await fetch(statusUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: jobId,
        status: status,
        error: error,
      }),
    });
  } catch (err) {
    console.error("Failed to report job status:", err);
  }
}

/**
 * Get the number of pending jobs for the connected account
 * @returns {Promise<number>} Number of pending jobs
 */
async function getPendingJobsCount() {
  try {
    const state = await new Promise((resolve) => {
      chrome.storage.local.get(
        ["socialora_connection_state", "socialora_connected_user"],
        (data) => resolve(data)
      );
    });

    if (
      state.socialora_connection_state !== "connected" ||
      !state.socialora_connected_user
    ) {
      return 0;
    }

    const connectedUser = state.socialora_connected_user;
    const config = await CONFIG.getCurrent();

    const countUrl = buildApiUrl(
      config.BACKEND_URL,
      `api/campaigns/jobs/count?ig_user_id=${connectedUser.pk}`
    );

    const response = await fetch(countUrl, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      return 0;
    }

    const data = await response.json();
    return data.count || 0;
  } catch (error) {
    console.error("Failed to get pending jobs count:", error);
    return 0;
  }
}

// ---------------------------------------------------------------------------
// Install hook
// ---------------------------------------------------------------------------

chrome.runtime.onInstalled.addListener(() => {
  console.log("Socialora Instagram Session Grabber installed");

  // Start job queue poller on install
  startJobQueuePoller();
});

// Start job queue poller when service worker starts
startJobQueuePoller();

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log("Extension started");
  startJobQueuePoller();
});
