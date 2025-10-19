/**
 * Creates a self-contained widget to display Google Analytics active users.
 * This function injects its own HTML and CSS into the page.
 *
 * @param {object} options - The configuration for the widget.
 * @param {string} options.apiUrl - The URL of the getGa4RealtimeUsers cloud function.
 * @param {string} options.propertyId - The GA4 Property ID to fetch data for.
 * @param {number} [options.reloadTimeInterval=30000] - The refresh interval in milliseconds. Defaults to 30 seconds.
 * @param {string} [options.position='bottom-right'] - The corner to display the widget in.
 *   Possible values: 'bottom-right', 'bottom-left', 'top-right', 'top-left'.
 * @param {string} [options.title='Online Users'] - The title displayed on the widget.
 */
function createGaActiveUsersWidget(options) {
  const {
    apiUrl,
    propertyId,
    reloadTimeInterval,
    position = "bottom-right",
    title = "Online Users",
  } = options;

  if (!apiUrl || !propertyId) {
    console.error(
      "GA Active Users Widget: `apiUrl` and `propertyId` are required options."
    );
    return;
  }

  const interval = reloadTimeInterval || 30000; // Default to 30 seconds

  // --- 1. Inject CSS ---
  const style = document.createElement("style");
  style.textContent = `
        @keyframes ga-widget-flash {
            0% { background-color: #eaf1fb; }
            100% { background-color: #ffffff; }
        }

        .ga-active-users-widget {
            position: fixed;
            ${position.includes("bottom") ? "bottom: 20px;" : "top: 20px;"}
            ${position.includes("right") ? "right: 20px;" : "left: 20px;"}
            background-color: #ffffff;
            border: 1px solid #e0e0e0;
            font-size: var(--ga-widget-font-size, 12px);
            border-radius: 1em;
            padding: 0.25em 0.3em;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
            z-index: 9999;
            box-shadow: 0 0.25em 0.75em rgba(0,0,0,0.1);
            display: flex;
            align-items: center;
            gap: 0.5em;
            transition: opacity 0.3s ease-in-out, background-color 0.3s ease;
            opacity: 0.75;
            cursor: default;
        }
        .ga-active-users-widget:hover, .ga-active-users-widget:focus {
            opacity: 1;
            outline: none;
        }
        .ga-active-users-widget--updated {
            animation: ga-widget-flash 0.7s ease-out;
        }
        .ga-active-users-widget--error {
            background-color: #fff0f0;
            border-color: #ffc0c0;
        }
        .ga-active-users-widget__title {
            font-size: 0.9em;
            font-weight: 500;
            color: #5f6368;
            margin: 0;
        }
        .ga-active-users-widget__value {
            font-weight: 700;
            color: #1a73e8;
            line-height: 1.2;
        }
        .ga-active-users-widget__error-msg {
            font-size: 0.7em;
            color: #d93025;
        }
    `;
  document.head.appendChild(style);

  // --- 2. Create Widget HTML ---
  const widget = document.createElement("div");
  widget.className = "ga-active-users-widget";
  widget.title = "Active users right now";
  widget.setAttribute("tabindex", "0"); // Make it focusable
  widget.innerHTML = `
        <div class="ga-active-users-widget__title">${title}</div>
        <div class="ga-active-users-widget__value">...</div>
    `;
  document.body.appendChild(widget);

  // Remove animation class when it's done
  widget.addEventListener("animationend", () => {
    widget.classList.remove("ga-active-users-widget--updated");
  });

  const valueElement = widget.querySelector(".ga-active-users-widget__value");
  let lastValue = null;

  // --- 3. Fetch and Update Data ---
  const fetchActiveUsers = () => {
    const fetchUrl = `${apiUrl}?propertyId=${propertyId}`;
    fetch(fetchUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Network response was not ok (${response.status})`);
        }
        return response.json();
      })
      .then((data) => {
        widget.classList.remove("ga-active-users-widget--error");
        valueElement.classList.remove("ga-active-users-widget__error-msg");

        // Animate only if the value has changed
        if (lastValue !== null && lastValue !== data.activeUsers) {
          widget.classList.add("ga-active-users-widget--updated");
        }
        lastValue = data.activeUsers;
        valueElement.textContent = data.activeUsers;
      })
      .catch((error) => {
        console.error("GA Active Users Widget: Error fetching data:", error);
        widget.classList.add("ga-active-users-widget--error");
        valueElement.textContent = "Error";
        valueElement.classList.add("ga-active-users-widget__error-msg");
      });
  };

  // --- 4. Initial Fetch and Set Interval ---
  fetchActiveUsers();
  setInterval(fetchActiveUsers, interval);
}
