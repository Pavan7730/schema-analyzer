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

    const item = document.createElement("div");
    item.className = "schema-item";

    item.innerHTML = `
      <div class="schema-header">
        <span class="schema-type">${type}</span>
        <span class="toggle">▾</span>
      </div>
      <div class="schema-body">
        <pre>${JSON.stringify(schema, null, 2)}</pre>
      </div>
    `;

    const header = item.querySelector(".schema-header");
    const body = item.querySelector(".schema-body");
    const toggle = item.querySelector(".toggle");

    header.addEventListener("click", () => {
      const open = body.style.display === "block";
      body.style.display = open ? "none" : "block";
      toggle.textContent = open ? "▾" : "▴";
    });

    container.appendChild(item);
  });
}

analyzePage();
