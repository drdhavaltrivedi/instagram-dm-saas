// Content script to receive cookies from extension and save to localStorage
// This runs in the page context and can access localStorage directly

console.log('Socialora content script loaded');

// Announce to the page that the content script is present (helps debug injection)
try {
  window.postMessage({ type: 'SOCIALORA_CONTENT_SCRIPT_LOADED', timestamp: Date.now() }, window.location.origin);
  console.log('Content script: announced presence to page via window.postMessage');
} catch (e) {
  console.warn('Content script: could not announce presence to page', e);
}

// Signal that content script is ready (send to background, which can notify popup)
chrome.runtime.sendMessage({ type: 'CONTENT_SCRIPT_READY', tabId: null }, (response) => {
  if (chrome.runtime.lastError) {
    // Ignore errors - background might not be listening
  } else {
    console.log('Content script ready signal sent');
  }
});

// Listen for messages from page (window.postMessage)
window.addEventListener('message', (event) => {
  // Only accept messages from same origin
  if (event.origin !== window.location.origin) {
    return;
  }

  // Respond to pings from the page (debug helper to verify content script injection)
  if (event.data && event.data.type === 'SOCIALORA_PING') {
    console.log('Content script: received PING from page', { origin: event.origin });
    try {
      const resp = { type: 'SOCIALORA_PONG', timestamp: Date.now() };
      window.postMessage(resp, window.location.origin);
      // Also dispatch a DOM event for page listeners
      window.dispatchEvent(new CustomEvent('socialora_pong', { detail: resp }));
      console.log('Content script: replied PONG to page');
    } catch (err) {
      console.warn('Content script: failed to reply PONG', err);
    }
    return;
  }
  
  // Handle cookie request from page
  if (event.data && event.data.type === 'SOCIALORA_REQUEST_COOKIES') {
    const { userId, storageKey } = event.data;
    console.log('Content script: Received cookie request from page:', { userId, storageKey });
    
    // Get cookies from chrome.storage.local
    const key = storageKey || `socialora_cookies_${userId}`;
    chrome.storage.local.get([key], (result) => {
      const cookies = result[key];
      if (cookies) {
        console.log('Content script: Found cookies in chrome.storage.local, sending to page');
        // Save to localStorage
        try {
          const cookiesJson = JSON.stringify(cookies);
          localStorage.setItem(key, cookiesJson);
          sessionStorage.setItem(key, cookiesJson);
          
          // Send response to page
          window.postMessage({
            type: 'SOCIALORA_COOKIES_RESPONSE',
            userId: userId,
            cookies: cookies,
            storageKey: key
          }, window.location.origin);
          
          // Also dispatch event
          window.dispatchEvent(new CustomEvent('socialora_cookies_saved', {
            detail: { userId, storageKey: key, cookies }
          }));
          
          console.log('✓ Cookies transferred from chrome.storage.local to localStorage');
        } catch (e) {
          console.error('Failed to transfer cookies:', e);
        }
      } else {
        console.warn('Content script: Cookies not found in chrome.storage.local for key:', key);
      }
    });
  }

  // Handle hashtag scraping request from the app
  if (event.data && event.data.type === 'SOCIALORA_SCRAPE_HASHTAG') {
    const { hashtag, bioKeywords } = event.data;
    console.log('Content script: Received hashtag scrape request:', { hashtag, bioKeywords });
    
    // Open Instagram hashtag page in a new tab and scrape it
    const hashtagUrl = `https://www.instagram.com/explore/tags/${hashtag}/`;
    chrome.runtime.sendMessage({ 
      type: 'OPEN_AND_SCRAPE_HASHTAG', 
      hashtag, 
      bioKeywords 
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Hashtag scrape error:', chrome.runtime.lastError);
        window.postMessage({
          type: 'SOCIALORA_HASHTAG_RESULT',
          hashtag,
          success: false,
          error: chrome.runtime.lastError.message
        }, window.location.origin);
      } else {
        window.postMessage({
          type: 'SOCIALORA_HASHTAG_RESULT',
          hashtag,
          success: true,
          data: response
        }, window.location.origin);
      }
    });
    return;
  }

  // Handle DM job sent from the web app -> forward to extension background for execution
  // Expected shape from page: { type: 'SOCIALORA_RUN_DM_JOB', job: { id, recipientUsername, message, ... } }
  if (event.data && event.data.type === 'SOCIALORA_RUN_DM_JOB') {
    const job = event.data.job || {};
    const jobId = job.id || null;
    const username = job.recipientUsername || job.recipient || job.recipient_username || job.recipientUserId || '';
    const dmMessage = job.message || '';

    console.log('Content script: Received DM job from page', { jobId, username, msgLen: (dmMessage || '').length, job });

    // Notify page that we accepted the job and will attempt to run it
    try {
      const acceptedPayload = { type: 'SOCIALORA_JOB_STATUS', jobId, status: 'accepted', detail: 'Forwarding to extension' };
      window.postMessage(acceptedPayload, window.location.origin);
      // Also dispatch a DOM event for page listeners
      window.dispatchEvent(new CustomEvent('socialora_job_status', { detail: acceptedPayload }));
    } catch (err) {
      console.warn('Content script: Failed to post accepted status to page', err);
    }

    // Forward to background to run the cold-DM automation
    try {
      console.log('Content script: Forwarding job to background RUN_COLD_DM', { jobId, username });
      chrome.runtime.sendMessage({ type: 'RUN_COLD_DM', username, dmMessage, jobId }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Content script: chrome.runtime.sendMessage lastError', chrome.runtime.lastError);
        }

        // Compose a friendly status payload to send back to the page
        const statusPayload = {
          type: 'SOCIALORA_JOB_STATUS',
          jobId,
          status: response && (response.status === 'success' || response.success) ? 'sent' : 'failed',
          response: response || null,
        };

        console.log('Content script: RUN_COLD_DM response -> posting back to page', statusPayload);

        try {
          window.postMessage(statusPayload, window.location.origin);
        } catch (postErr) {
          console.warn('Content script: Failed to post RUN_COLD_DM response to page', postErr);
        }

        try {
          window.dispatchEvent(new CustomEvent('socialora_job_status', { detail: statusPayload }));
        } catch (evErr) {
          console.warn('Content script: Failed to dispatch socialora_job_status event', evErr);
        }
      });
    } catch (sendErr) {
      console.error('Content script: Failed to send RUN_COLD_DM to background', sendErr);
      const failPayload = { type: 'SOCIALORA_JOB_STATUS', jobId, status: 'failed', response: { error: sendErr && sendErr.message } };
      try { window.postMessage(failPayload, window.location.origin); } catch (_) {}
      try { window.dispatchEvent(new CustomEvent('socialora_job_status', { detail: failPayload })); } catch (_) {}
    }
  }
});

// Listen for messages from extension (background/popup)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Content Script] Received message:', message.type, 'from:', sender);
  
  // Forward hashtag data from background to the page
  if (message.type === 'HASHTAG_DATA_FROM_EXTENSION') {
    console.log('[Content Script] Forwarding hashtag data to page');
    console.log('[Content Script] Data:', { hashtag: message.data?.hashtag, posts: message.data?.posts?.length });
    
    try {
      // Post to page's window
      window.postMessage({
        type: 'SOCIALORA_HASHTAG_DATA_AVAILABLE',
        data: message.data
      }, window.location.origin);
      
      // Also dispatch custom event
      window.dispatchEvent(new CustomEvent('socialora_hashtag_data', {
        detail: {
          type: 'SOCIALORA_HASHTAG_DATA_AVAILABLE',
          data: message.data
        }
      }));
      
      console.log('[Content Script] ✓ Hashtag data forwarded to page');
      sendResponse({ success: true });
    } catch (e) {
      console.error('[Content Script] Error forwarding hashtag data:', e);
      sendResponse({ success: false, error: e.message });
    }
    return true;
  }
  
  if (message.type === 'SAVE_COOKIES') {
    const { userId, cookies } = message;
    const storageKey = `socialora_cookies_${userId}`;
    
    console.log('Saving cookies for userId:', userId);
    console.log('Storage key:', storageKey);
    console.log('Cookies structure:', cookies ? Object.keys(cookies) : 'null');
    
    try {
      // Save to localStorage
      const cookiesJson = JSON.stringify(cookies);
      localStorage.setItem(storageKey, cookiesJson);
      console.log(`✓ Cookies saved to localStorage via content script (key: ${storageKey})`);
      console.log('Cookies JSON length:', cookiesJson.length);
      
      // Verify it was saved
      const verify = localStorage.getItem(storageKey);
      if (verify) {
        console.log('✓ Verified: Cookies are in localStorage');
        console.log('Verification length:', verify.length);
      } else {
        console.error('✗ ERROR: Cookies not found after saving!');
      }
      
      // Also save to sessionStorage as backup
      try {
        sessionStorage.setItem(storageKey, cookiesJson);
        console.log('✓ Cookies also saved to sessionStorage');
      } catch (sessionErr) {
        console.warn('Failed to save to sessionStorage:', sessionErr);
      }
      
      // Trigger events to notify the page
      try {
        window.dispatchEvent(new CustomEvent('socialora_cookies_saved', { 
          detail: { userId, storageKey, cookies } 
        }));
        console.log('✓ Custom event dispatched');
      } catch (eventErr) {
        console.warn('Failed to dispatch custom event:', eventErr);
      }
      
      try {
        window.postMessage({
          type: 'SOCIALORA_COOKIES_SAVED',
          userId: userId,
          cookies: cookies,
          storageKey: storageKey
        }, window.location.origin);
        console.log('✓ PostMessage sent');
      } catch (postErr) {
        console.warn('Failed to send postMessage:', postErr);
      }
      
      // Also trigger a storage event manually (for cross-tab communication)
      try {
        // Create a storage event manually
        const storageEvent = new Event('storage');
        Object.defineProperty(storageEvent, 'key', { value: storageKey });
        Object.defineProperty(storageEvent, 'newValue', { value: cookiesJson });
        Object.defineProperty(storageEvent, 'storageArea', { value: localStorage });
        window.dispatchEvent(storageEvent);
        console.log('✓ Storage event dispatched');
      } catch (storageErr) {
        console.warn('Failed to dispatch storage event:', storageErr);
      }
      
      sendResponse({ success: true, storageKey: storageKey });
      return true; // Keep channel open for async response
    } catch (e) {
      console.error('Failed to save cookies via content script:', e);
      console.error('Error details:', e.message, e.stack);
      sendResponse({ success: false, error: e.message });
      return true;
    }

    // Forward RUN_COLD_DM_STATUS messages from background to the page for debugging
    if (message.type === 'RUN_COLD_DM_STATUS') {
      try {
        console.log('Content script: forwarding RUN_COLD_DM_STATUS to page', message);
        const payload = Object.assign({}, message);
        window.postMessage(payload, window.location.origin);
        try { window.dispatchEvent(new CustomEvent('socialora_job_status', { detail: payload })); } catch (e) { console.warn('Content script: dispatch error', e); }
      } catch (e) {
        console.warn('Content script: failed to forward RUN_COLD_DM_STATUS', e);
      }
      // No response expected
      return false;
    }
  }
  
  return false;
});

// Log when content script is ready
console.log('Content script message listener registered');

// Function to scrape Instagram hashtag page if we're on one
function scrapeHashtagPage() {
  // Check if we're on a hashtag page OR search page
  const currentUrl = window.location.href;
  const hashtagMatch = currentUrl.match(/instagram\.com\/explore\/tags\/([^\/\?]+)/);
  const searchMatch = currentUrl.match(/instagram\.com\/explore\/search\/keyword\/\?q=([^&]+)/);
  
  let hashtag = null;
  if (hashtagMatch) {
    hashtag = hashtagMatch[1];
    console.log('[Hashtag Scraper] On hashtag page:', hashtag);
  } else if (searchMatch) {
    hashtag = decodeURIComponent(searchMatch[1]).replace(/[%+*]/g, '').trim();
    console.log('[Hashtag Scraper] On search page for:', hashtag);
  } else {
    console.log('[Hashtag Scraper] Not on a hashtag/search page, URL:', currentUrl);
    return null;
  }
  
  const posts = [];
  const usernames = new Set();
  
  try {
    // Method 1: Extract from window._sharedData
    if (typeof window._sharedData !== 'undefined' && window._sharedData && window._sharedData.entry_data) {
      console.log('[Hashtag Scraper] Found window._sharedData');
      
      // Check TagPage (old format)
      if (window._sharedData.entry_data.TagPage) {
        const tagPage = window._sharedData.entry_data.TagPage[0];
        const edges = tagPage?.graphql?.hashtag?.edge_hashtag_to_media?.edges || [];
        
        console.log('[Hashtag Scraper] Found edges from TagPage:', edges.length);
        
        edges.forEach(edge => {
          const node = edge.node;
          posts.push({
            id: node.id || node.shortcode,
            shortcode: node.shortcode,
            thumbnail: node.thumbnail_src || node.display_url,
            displayUrl: node.display_url || node.thumbnail_src,
            likeCount: node.edge_liked_by?.count || 0,
            commentCount: node.edge_media_to_comment?.count || 0,
            caption: node.edge_media_to_caption?.edges?.[0]?.node?.text || '',
            owner: {
              username: node.owner?.username || '',
              profilePicUrl: node.owner?.profile_pic_url || '',
              fullName: node.owner?.full_name || '',
              isVerified: node.owner?.is_verified || false,
              followerCount: node.owner?.edge_followed_by?.count,
              followingCount: node.owner?.edge_follow?.count,
              postCount: node.owner?.edge_owner_to_timeline_media?.count,
            },
            postUrl: `https://www.instagram.com/p/${node.shortcode}/`,
          });
          
          if (node.owner?.username) {
            usernames.add(node.owner.username);
          }
        });
        
        console.log(`[Hashtag Scraper] Extracted ${posts.length} posts from TagPage`);
      } 
      
      // Check SearchPage (new format)
      if (window._sharedData.entry_data.SearchPage) {
        console.log('[Hashtag Scraper] Found SearchPage data');
        const searchPage = window._sharedData.entry_data.SearchPage[0];
        // Try to extract from search results
        const searchResults = searchPage?.graphql?.hashtag_search?.edges || [];
        console.log('[Hashtag Scraper] Search results:', searchResults.length);
      }
    } else {
      console.log('[Hashtag Scraper] window._sharedData not available');
    }
    
    // Method 2: Extract from DOM (works for both old and new format)
    console.log('[Hashtag Scraper] Trying DOM extraction...');
    
    // Try multiple selectors for posts
    const postSelectors = [
      'article a[href*="/p/"]',              // Standard article links
      'a[href*="/p/"][role="link"]',         // Links with role
      'a[href^="/p/"]',                       // Direct post links
      'div[role="button"] a[href*="/p/"]',   // Buttons containing links
      '[class*="Post"] a[href*="/p/"]'       // Any post-related class
    ];
    
    let allPostLinks = [];
    postSelectors.forEach(selector => {
      const links = document.querySelectorAll(selector);
      console.log(`[Hashtag Scraper] Selector "${selector}" found:`, links.length);
      allPostLinks.push(...Array.from(links));
    });
    
    // Deduplicate by href
    const seenHrefs = new Set();
    const uniquePostLinks = allPostLinks.filter(link => {
      const href = link.getAttribute('href');
      if (!href || seenHrefs.has(href)) return false;
      seenHrefs.add(href);
      return true;
    });
    
    console.log('[Hashtag Scraper] Unique post links found:', uniquePostLinks.length);
    
    uniquePostLinks.forEach((link, index) => {
      const href = link.getAttribute('href');
      const shortcodeMatch = href?.match(/\/p\/([^\/\?]+)/);
      if (shortcodeMatch) {
        const img = link.querySelector('img') || link.closest('div').querySelector('img');
        const thumbnail = img?.src || img?.getAttribute('src') || '';
        
        // Try to find username associated with this post
        // Look for username in nearby elements and parent structures
        let postUsername = null;
        
        // Method 1: Check parent article/container for username links
        const parent = link.closest('article') || link.closest('[role="button"]') || link.closest('div[style*="flex"]')?.parentElement;
        if (parent) {
          // Look for username links near this post
          const userLinks = parent.querySelectorAll('a[href^="/"]');
          for (const userLink of userLinks) {
            const userHref = userLink.getAttribute('href');
            const userMatch = userHref?.match(/^\/([a-zA-Z0-9._]+)\/?$/);
            if (userMatch && userMatch[1] && !['explore', 'p', 'reel', 'reels', 'tv', 'stories'].includes(userMatch[1])) {
              postUsername = userMatch[1];
              usernames.add(postUsername);
              break;
            }
          }
        }
        
        // Method 2: Look for img alt text which often contains username
        if (!postUsername && img) {
          const altText = img.getAttribute('alt');
          if (altText) {
            // Alt often says "Photo by USERNAME" or "USERNAME's post"
            const altMatch = altText.match(/(?:by|from)\s+@?([a-zA-Z0-9._]+)|^([a-zA-Z0-9._]+)'?s?\s+/i);
            if (altMatch) {
              const candidate = altMatch[1] || altMatch[2];
              // Filter out common false positives
              const invalidWords = ['Photo', 'photo', 'Image', 'image', 'Video', 'video', 'Post', 'post', 'Best', 'best', 'New', 'new', 'Latest', 'latest', 'Top', 'top'];
              if (candidate && !invalidWords.includes(candidate)) {
                postUsername = candidate;
                usernames.add(postUsername);
              }
            }
          }
        }
        
        // Method 3: Check for nearby text that might be username
        if (!postUsername && parent) {
          const textNodes = parent.querySelectorAll('a, span, div');
          for (const node of textNodes) {
            const text = node.textContent?.trim();
            if (text && text.startsWith('@')) {
              const usernameCandidate = text.substring(1).split(/[\s,]/)[0];
              if (/^[a-zA-Z0-9._]+$/.test(usernameCandidate)) {
                postUsername = usernameCandidate;
                usernames.add(postUsername);
                break;
              }
            }
          }
        }
        
        console.log(`[Hashtag Scraper] Post ${index}: shortcode=${shortcodeMatch[1]}, username=${postUsername || 'NOT FOUND'}`);
        
        posts.push({
          id: `dom_${index}`,
          shortcode: shortcodeMatch[1],
          thumbnail: thumbnail,
          postUrl: href.startsWith('http') ? href : `https://www.instagram.com${href}`,
          username: postUsername,
        });
      }
    });
    
    console.log(`[Hashtag Scraper] Extracted ${posts.length} posts from DOM`);
    console.log(`[Hashtag Scraper] Found ${usernames.size} usernames from posts`);
    
    // Method 3: Extract usernames from page scripts
    if (usernames.size === 0) {
      console.log('[Hashtag Scraper] Extracting usernames from scripts...');
      const scripts = document.querySelectorAll('script');
      scripts.forEach(script => {
        const content = script.textContent || '';
        const usernameMatches = content.matchAll(/"username"\s*:\s*"([^"]+)"/g);
        for (const match of usernameMatches) {
          if (match[1] && !match[1].startsWith('_') && match[1].length > 2) {
            usernames.add(match[1]);
          }
        }
      });
      console.log(`[Hashtag Scraper] Found ${usernames.size} usernames from scripts`);
    }
    
    // Method 4: Aggressive username extraction from all links
    console.log('[Hashtag Scraper] Extracting usernames from all page links...');
    const allLinks = document.querySelectorAll('a[href]');
    console.log('[Hashtag Scraper] Total links on page:', allLinks.length);
    
    allLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (!href) return;
      
      // Match username pattern
      const match = href.match(/^\/([a-zA-Z0-9._]+)\/?$/);
      if (match && match[1]) {
        const username = match[1];
        // Filter out common Instagram paths
        const excludedPaths = [
          'explore', 'p', 'reel', 'reels', 'stories', 'accounts', 'direct', 
          'create', 'settings', 'about', 'help', 'privacy', 'terms', 
          'support', 'press', 'api', 'jobs', 'blog', 'language'
        ];
        
        if (!excludedPaths.includes(username) && !username.startsWith('_')) {
          usernames.add(username);
        }
      }
    });
    
    console.log(`[Hashtag Scraper] Found ${usernames.size} potential usernames from links`);
    
    // Method 5: Extract from text content and attributes
    if (usernames.size < 10) {
      console.log('[Hashtag Scraper] Trying alternative username extraction from text...');
      const textElements = document.querySelectorAll('span, div, a');
      textElements.forEach(el => {
        const text = el.textContent?.trim();
        // Look for @username pattern
        const mentionMatch = text?.match(/@([a-zA-Z0-9._]+)/);
        if (mentionMatch && mentionMatch[1]) {
          usernames.add(mentionMatch[1]);
        }
      });
      console.log(`[Hashtag Scraper] Total usernames after text extraction: ${usernames.size}`);
    }
    
    const result = {
      hashtag,
      posts,
      usernames: Array.from(usernames).slice(0, 50), // Limit to 50 usernames
      timestamp: Date.now(),
    };
    
    console.log('[Hashtag Scraper] Final result:', {
      hashtag: result.hashtag,
      posts: result.posts.length,
      usernames: result.usernames.length
    });
    
    return result;
  } catch (error) {
    console.error('[Hashtag Scraper] Error:', error);
    return null;
  }
}

// Listen for hashtag scrape requests from the extension background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SCRAPE_CURRENT_PAGE') {
    console.log('[Hashtag Scraper] Received scrape request');
    const data = scrapeHashtagPage();
    sendResponse({ success: !!data, data });
    return true;
  }
});

// Auto-detect and send hashtag data if on hashtag page
window.addEventListener('load', () => {
  // Try scraping multiple times with increasing delays
  const attemptScrape = (attemptNumber = 1) => {
    console.log(`[Hashtag Scraper] Scrape attempt ${attemptNumber}`);
    const data = scrapeHashtagPage();
    
    if (data && (data.posts.length > 0 || data.usernames.length > 0)) {
      console.log('[Hashtag Scraper] ✓ Successfully scraped data');
      console.log('[Hashtag Scraper] Data:', { hashtag: data.hashtag, posts: data.posts.length, usernames: data.usernames.length });
      
      // Method 1: Send via background script to all app tabs
      chrome.runtime.sendMessage({
        type: 'HASHTAG_DATA_SCRAPED',
        data: data
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('[Hashtag Scraper] Error sending to background:', chrome.runtime.lastError);
        } else {
          console.log('[Hashtag Scraper] ✓ Data sent to background script');
        }
      });
      
      // Method 2: Store in chrome.storage for app to poll
      chrome.storage.local.set({
        'socialora_hashtag_data': {
          data: data,
          timestamp: Date.now()
        }
      }, () => {
        console.log('[Hashtag Scraper] ✓ Data stored in chrome.storage.local');
      });
      
      // Also post to current window (for debugging)
      window.postMessage({
        type: 'SOCIALORA_HASHTAG_DATA_AVAILABLE',
        data
      }, window.location.origin);
    } else {
      console.log('[Hashtag Scraper] No data found on attempt', attemptNumber);
      
      // Retry up to 5 times with increasing delays (search pages load slower)
      if (attemptNumber < 5) {
        const delay = attemptNumber * 1500; // 1.5s, 3s, 4.5s, 6s
        console.log(`[Hashtag Scraper] Will retry in ${delay}ms`);
        setTimeout(() => attemptScrape(attemptNumber + 1), delay);
      } else {
        console.log('[Hashtag Scraper] ✗ Failed to scrape after 5 attempts');
        // Store error state
        chrome.storage.local.set({
          'socialora_hashtag_data': {
            data: null,
            error: 'Failed to scrape hashtag page - Instagram may have changed their page structure',
            timestamp: Date.now()
          }
        });
      }
    }
  };
  
  // Start first attempt after 3 seconds (search pages need more time)
  setTimeout(() => attemptScrape(1), 3000);
});

// Expose manual scrape function for debugging
window.socialoraScrapeHashtag = function() {
  console.log('[Hashtag Scraper] Manual scrape triggered');
  const data = scrapeHashtagPage();
  console.log('[Hashtag Scraper] Manual scrape result:', data);
  
  if (data) {
    chrome.storage.local.set({
      'socialora_hashtag_data': {
        data: data,
        timestamp: Date.now()
      }
    }, () => {
      console.log('[Hashtag Scraper] ✓ Manual scrape data stored');
    });
    
    chrome.runtime.sendMessage({
      type: 'HASHTAG_DATA_SCRAPED',
      data: data
    });
  }
  
  return data;
};

console.log('[Hashtag Scraper] Manual scrape function available: window.socialoraScrapeHashtag()');

// Also listen for page load to check if we need to inject cookies
window.addEventListener('load', () => {
  console.log('Page loaded, content script ready');
  
  // Check if page is requesting cookies (from URL params)
  const urlParams = new URLSearchParams(window.location.search);
  const igUserId = urlParams.get('ig_user_id');
  if (igUserId) {
    console.log('Page loaded with ig_user_id, checking for cookies in chrome.storage.local');
    const storageKey = `socialora_cookies_${igUserId}`;
    chrome.storage.local.get([storageKey], (result) => {
      const cookies = result[storageKey];
      if (cookies) {
        console.log('Found cookies in chrome.storage.local, transferring to localStorage');
        try {
          const cookiesJson = JSON.stringify(cookies);
          localStorage.setItem(storageKey, cookiesJson);
          sessionStorage.setItem(storageKey, cookiesJson);
          
          // Notify page
          window.postMessage({
            type: 'SOCIALORA_COOKIES_SAVED',
            userId: igUserId,
            cookies: cookies,
            storageKey: storageKey
          }, window.location.origin);
          
          window.dispatchEvent(new CustomEvent('socialora_cookies_saved', {
            detail: { userId: igUserId, storageKey, cookies }
          }));
          
          console.log('✓ Cookies auto-transferred on page load');
        } catch (e) {
          console.error('Failed to transfer cookies on page load:', e);
        }
      }
    });
  }
});

