async function analyzePage() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // Show current page URL
  document.getElementById("pageUrl").textContent = tab.url;

  const result = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const schemas = [];

      document
        .querySelectorAll('script[type="application/ld+json"]')
        .forEach(script => {
          try {
            const json = JSON.parse(script.innerText);
            schemas.push(json);
          } catch (e) {}
        });

      return schemas;
    }
  });

  renderSchemas(result[0].result || []);
}

function renderSchemas(schemas) {
  const container = document.getElementById("content");
  container.innerHTML = "";

  if (!schemas.length) {
    container.innerHTML = `<div class="loading">No schema found on this page</div>`;
    return;
  }

  schemas.forEach(schema => {
    const type = Array.isArray(schema["@type"])
      ? schema["@type"].join(", ")
      : schema["@type"] || "Unknown";

    const jsonString = JSON.stringify(schema, null, 2);

    const item = document.createElement("div");
    item.className = "schema-item";

    item.innerHTML = `
      <div class="schema-header">
        <span class="schema-type">${type}</span>
        <div class="schema-actions">
          <button class="action-btn search-btn">🔍 Search</button>
          <button class="action-btn copy-btn">📋 Copy</button>
        </div>
      </div>

      <div class="schema-body">
        <input class="search-box" placeholder="Search in schema..." />
        <pre>${jsonString}</pre>
      </div>
    `;

    const header = item.querySelector(".schema-header");
    const body = item.querySelector(".schema-body");
    const pre = item.querySelector("pre");
    const searchBox = item.querySelector(".search-box");
    const copyBtn = item.querySelector(".copy-btn");

    // Toggle dropdown
    header.addEventListener("click", (e) => {
      if (e.target.tagName === "BUTTON") return;
      body.style.display = body.style.display === "block" ? "none" : "block";
    });

    // Search inside schema
    searchBox.addEventListener("input", () => {
      const query = searchBox.value.toLowerCase();
      const lines = jsonString.split("\n");

      const filtered = lines.filter(line =>
        line.toLowerCase().includes(query)
      );

      pre.textContent = filtered.length
        ? filtered.join("\n")
        : "No matching results";
    });

    // Copy schema
    copyBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(jsonString);
      copyBtn.textContent = "✅ Copied";
      setTimeout(() => (copyBtn.textContent = "📋 Copy"), 1500);
    });

    container.appendChild(item);
  });
}

analyzePage();
