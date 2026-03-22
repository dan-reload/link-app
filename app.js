/* ==============================================
   LINK SAVER — App Logic

   This file handles everything the app does:
   saving links, showing them on screen, deleting
   them, and handling the "add link" form.

   All saved links live in "localStorage" — a small
   storage area built into every web browser. It
   survives page reloads and closing the browser,
   but is cleared if the user clears browser data.
   ============================================== */


/* ==============================================
   1. GRAB REFERENCES TO HTML ELEMENTS

   We need to talk to various elements on the page
   (buttons, inputs, containers). We find them once
   here so we can reuse them throughout the code.
   ============================================== */
const linksList = document.getElementById('linksList');
const emptyState = document.getElementById('emptyState');
const linkCount = document.getElementById('linkCount');
const addButton = document.getElementById('addButton');
const modalOverlay = document.getElementById('modalOverlay');
const modal = document.getElementById('modal');
const addLinkForm = document.getElementById('addLinkForm');
const urlInput = document.getElementById('urlInput');
const titleInput = document.getElementById('titleInput');
const toast = document.getElementById('toast');


/* ==============================================
   2. DATA FUNCTIONS

   These functions read and write to localStorage.
   Think of localStorage like a simple text file
   that the browser manages for you.
   ============================================== */

/**
 * Get all saved links from storage.
 * Returns an array (list) of link objects, newest first.
 *
 * Each link object looks like:
 *   { id: 1234567890, url: "https://...", title: "My link", savedAt: "2024-..." }
 */
function getLinks() {
  const data = localStorage.getItem('links');
  return data ? JSON.parse(data) : [];
}

/**
 * Save the full list of links back to storage.
 */
function setLinks(links) {
  localStorage.setItem('links', JSON.stringify(links));
}

/**
 * Add a new link to storage.
 * Returns the new link object.
 */
function saveLink(url, title) {
  const links = getLinks();

  const newLink = {
    id: Date.now(),
    url: url,
    title: title || getDomain(url),
    savedAt: new Date().toISOString(),
  };

  links.unshift(newLink);
  setLinks(links);

  return newLink;
}

/**
 * Delete a link by its ID.
 */
function deleteLink(id) {
  const links = getLinks();
  const updated = links.filter(function(link) {
    return link.id !== id;
  });
  setLinks(updated);
}


/* ==============================================
   3. DISPLAY FUNCTIONS

   These functions build the visible list of links
   on the screen from the data in localStorage.
   ============================================== */

/**
 * Render (draw) all saved links on the page.
 * Called whenever the data changes.
 */
function renderLinks() {
  const links = getLinks();

  // Update the link count in the header
  const count = links.length;
  linkCount.textContent = count === 0
    ? '0 saved'
    : count + ' saved';

  // Show or hide the "no links yet" message
  if (count === 0) {
    emptyState.classList.remove('hidden');
    linksList.innerHTML = '';
    return;
  }
  emptyState.classList.add('hidden');

  // Build the HTML for each link row
  linksList.innerHTML = links.map(function(link) {
    return createCardHTML(link);
  }).join('');

  // Attach swipe-to-delete gestures to each row
  setupSwipeGestures();
}

/**
 * Build the HTML string for a single link row.
 *
 * Layout (like an iOS list row):
 *   [Favicon]  [Title + Domain]  [Time >]
 */
function createCardHTML(link) {
  const domain = getDomain(link.url);
  const timeAgo = getTimeAgo(link.savedAt);

  // Google's free favicon service — gets any website's icon
  const faviconUrl = 'https://www.google.com/s2/favicons?domain='
    + encodeURIComponent(domain) + '&sz=64';

  return ''
    + '<div class="link-card-wrapper" data-id="' + link.id + '">'
    +   '<div class="link-delete-bg">'
    +     '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">'
    +       '<polyline points="3 6 5 6 21 6"></polyline>'
    +       '<path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>'
    +       '<path d="M10 11v6"></path>'
    +       '<path d="M14 11v6"></path>'
    +     '</svg>'
    +   '</div>'
    +   '<a class="link-card" href="' + escapeHTML(link.url) + '" target="_blank" rel="noopener noreferrer">'
    +     '<img class="link-card-favicon" src="' + faviconUrl + '" alt="" loading="lazy">'
    +     '<div class="link-card-body">'
    +       '<div class="link-card-title">' + escapeHTML(link.title) + '</div>'
    +       '<div class="link-card-url">' + escapeHTML(domain) + '</div>'
    +     '</div>'
    +     '<div class="link-card-accessory">'
    +       '<span class="link-card-time">' + timeAgo + '</span>'
    +       '<svg class="link-card-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">'
    +         '<polyline points="9 18 15 12 9 6"></polyline>'
    +       '</svg>'
    +     '</div>'
    +   '</a>'
    + '</div>';
}


/* ==============================================
   4. MODAL (Add Link Panel)

   Open and close the sliding panel where users
   type in a URL to save.
   ============================================== */

/** Open the "add link" modal */
function openModal() {
  modalOverlay.classList.add('active');
  addButton.classList.add('active');

  // Focus the URL input so the keyboard opens immediately on mobile
  setTimeout(function() {
    urlInput.focus();
  }, 350);
}

/** Close the modal and reset the form */
function closeModal() {
  modalOverlay.classList.remove('active');
  addButton.classList.remove('active');
  addLinkForm.reset();
}

// Toggle modal when the toolbar add button is tapped
addButton.addEventListener('click', function() {
  if (modalOverlay.classList.contains('active')) {
    closeModal();
  } else {
    openModal();
  }
});

// Close modal when tapping the dark overlay (outside the panel)
modalOverlay.addEventListener('click', function(event) {
  if (event.target === modalOverlay) {
    closeModal();
  }
});


/* ==============================================
   5. AUTO-FETCH PAGE TITLE

   When the user pastes a URL into the URL field,
   we automatically fetch the page title using a
   free API. This means you don't have to type a
   title manually — it fills in automatically.

   We use "corsproxy.io" to get around browser
   security restrictions (CORS) that normally
   prevent fetching other websites' HTML.
   ============================================== */

/**
 * Try to fetch the <title> of a webpage.
 * Returns the title text, or empty string if it fails.
 *
 * Uses jsonlink.io — a free API that extracts metadata
 * (title, description, image) from any URL. No API key needed.
 */
function fetchPageTitle(url) {
  // microlink.io is a free API that extracts page metadata.
  // Free tier: 50 requests/day, no API key needed.
  var apiUrl = 'https://api.microlink.io?url=' + encodeURIComponent(url);

  return fetch(apiUrl, {
    signal: AbortSignal.timeout(8000)
  })
    .then(function(response) {
      if (!response.ok) return '';
      return response.json();
    })
    .then(function(data) {
      if (data && data.data && data.data.title) {
        return data.data.title.trim();
      }
      return '';
    })
    .catch(function() {
      // If the fetch fails (offline, timeout, blocked), just
      // return empty — the user can type a title manually
      return '';
    });
}

/*
  Listen for changes to the URL input field.
  When a URL is pasted (or typed), automatically
  fetch the page title and fill it in — but only
  if the user hasn't already typed their own title.
*/
var titleFetchTimer = null;

urlInput.addEventListener('input', function() {
  var url = urlInput.value.trim();

  // Don't overwrite a title the user has already typed
  if (titleInput.value.trim() !== '') return;

  // Add https:// if missing, for the fetch
  if (url && !url.match(/^https?:\/\//)) {
    url = 'https://' + url;
  }

  if (!isValidURL(url)) return;

  // Small delay — wait for the user to finish pasting/typing
  if (titleFetchTimer) clearTimeout(titleFetchTimer);

  titleFetchTimer = setTimeout(function() {
    // Show a loading hint in the placeholder
    titleInput.placeholder = 'Fetching title...';

    fetchPageTitle(url).then(function(title) {
      // Only fill if the user still hasn't typed anything
      if (titleInput.value.trim() === '' && title) {
        titleInput.value = title;
      }
      titleInput.placeholder = 'Title (optional)';
    });
  }, 300);
});


/* ==============================================
   6. FORM HANDLING

   When the user submits the "add link" form,
   validate the URL and save it.
   ============================================== */

addLinkForm.addEventListener('submit', function(event) {
  event.preventDefault();

  var url = urlInput.value.trim();
  var title = titleInput.value.trim();

  // If they didn't include "http" at the start, add it
  if (url && !url.match(/^https?:\/\//)) {
    url = 'https://' + url;
  }

  if (!isValidURL(url)) {
    showToast('Please enter a valid URL');
    return;
  }

  saveLink(url, title);
  renderLinks();
  closeModal();
  showToast('Saved');
});


/* ==============================================
   6. SWIPE TO DELETE

   On mobile, users can swipe a row to the left
   to reveal a red delete button — just like
   swiping in iOS Mail or Messages.
   ============================================== */

function setupSwipeGestures() {
  var wrappers = document.querySelectorAll('.link-card-wrapper');

  wrappers.forEach(function(wrapper) {
    var card = wrapper.querySelector('.link-card');
    var startX = 0;
    var currentX = 0;
    var isSwiping = false;

    card.addEventListener('touchstart', function(e) {
      startX = e.touches[0].clientX;
      currentX = startX;
      isSwiping = false;
      card.style.transition = 'none';
    }, { passive: true });

    card.addEventListener('touchmove', function(e) {
      currentX = e.touches[0].clientX;
      var deltaX = currentX - startX;

      // Only swipe left, cap at -80px (width of delete button)
      if (deltaX < -10) {
        isSwiping = true;
        wrapper.classList.add('swiping');
        var moveX = Math.max(deltaX, -80);
        card.style.transform = 'translateX(' + moveX + 'px)';
      }
    }, { passive: true });

    card.addEventListener('touchend', function() {
      card.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';

      var deltaX = currentX - startX;

      if (deltaX < -50) {
        card.style.transform = 'translateX(-80px)';
      } else {
        card.style.transform = 'translateX(0)';
        wrapper.classList.remove('swiping');
      }
    });

    card.addEventListener('click', function(e) {
      if (isSwiping) {
        e.preventDefault();
      }
    });

    var deleteBg = wrapper.querySelector('.link-delete-bg');
    deleteBg.addEventListener('click', function() {
      var id = parseInt(wrapper.getAttribute('data-id'));

      // Animate the row sliding away
      wrapper.style.transition = 'transform 0.3s ease, opacity 0.3s ease, max-height 0.3s ease';
      wrapper.style.transform = 'translateX(-100%)';
      wrapper.style.opacity = '0';
      wrapper.style.maxHeight = '0';

      setTimeout(function() {
        deleteLink(id);
        renderLinks();
        showToast('Deleted');
      }, 300);
    });
  });
}


/* ==============================================
   7. SHARE TARGET HANDLING

   When the user shares a URL from Safari (or any
   other app) into Link Saver, the URL arrives as
   a "query parameter" in the web address.
   ============================================== */

function handleShareTarget() {
  var params = new URLSearchParams(window.location.search);
  var sharedUrl = params.get('url');
  var sharedTitle = params.get('title');
  var sharedText = params.get('text');

  if (!sharedUrl && sharedText) {
    var urlMatch = sharedText.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
      sharedUrl = urlMatch[0];
    }
  }

  if (sharedUrl) {
    // Save immediately with whatever title we have
    var link = saveLink(sharedUrl, sharedTitle || '');
    renderLinks();
    showToast('Saved');
    window.history.replaceState({}, '', '.');

    // If no title was provided, try to fetch one in the background
    if (!sharedTitle) {
      fetchPageTitle(sharedUrl).then(function(fetchedTitle) {
        if (fetchedTitle) {
          // Update the saved link with the fetched title
          var links = getLinks();
          for (var i = 0; i < links.length; i++) {
            if (links[i].id === link.id) {
              links[i].title = fetchedTitle;
              break;
            }
          }
          setLinks(links);
          renderLinks();
        }
      });
    }
  }
}


/* ==============================================
   8. TOAST NOTIFICATIONS

   Show a brief pop-up message at the bottom of
   the screen, then fade it out after 1.5 seconds.
   ============================================== */

var toastTimer = null;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('visible');

  if (toastTimer) {
    clearTimeout(toastTimer);
  }

  toastTimer = setTimeout(function() {
    toast.classList.remove('visible');
  }, 1500);
}


/* ==============================================
   9. HELPER FUNCTIONS
   ============================================== */

/**
 * Extract the domain name from a URL.
 * Example: "https://twitter.com/user/status/123" → "twitter.com"
 */
function getDomain(url) {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch (e) {
    return url;
  }
}

/**
 * Turn a date string into a human-friendly "time ago" label.
 */
function getTimeAgo(dateString) {
  var now = new Date();
  var then = new Date(dateString);
  var seconds = Math.floor((now - then) / 1000);

  if (seconds < 60)    return 'Now';
  if (seconds < 3600)  return Math.floor(seconds / 60) + 'm';
  if (seconds < 86400) return Math.floor(seconds / 3600) + 'h';
  if (seconds < 172800) return 'Yesterday';
  if (seconds < 604800) return Math.floor(seconds / 86400) + 'd';

  return then.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

/**
 * Check if a string looks like a valid URL.
 */
function isValidURL(string) {
  try {
    var url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

/**
 * Escape HTML special characters to prevent XSS attacks.
 */
function escapeHTML(str) {
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}


/* ==============================================
   10. START THE APP
   ============================================== */

renderLinks();
handleShareTarget();
