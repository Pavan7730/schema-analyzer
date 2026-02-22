async function getSchemas() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  const result = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const schemas = [];

      document
        .querySelectorAll('script[type="application/ld+json"]')
        .forEach((script) => {
          try {
            const json = JSON.parse(script.innerText);
            schemas.push(json);
          } catch (e) {}
        });

      return schemas;
    }
  });

  return result[0].result || [];
}

function renderSchemas(schemas) {
  const container = document.getElementById("content");
  container.innerHTML = "";

  if (!schemas.length) {
    container.innerHTML = `<div class="loading">No schema found</div>`;
    return;
  }

  schemas.forEach((schema, index) => {
    const type = Array.isArray(schema["@type"])
      ? schema["@type"].join(", ")
      : schema["@type"] || "Unknown";

    const card = document.createElement("div");
    card.className = "schema-card";

    card.innerHTML = `
      <h3>${type}</h3>
      <div class="schema-meta">Format: JSON-LD</div>
      <pre class="schema-json">${JSON.stringify(schema, null, 2)}</pre>
    `;

    container.appendChild(card);
  });
}

(async function init() {
  const schemas = await getSchemas();
  renderSchemas(schemas);
})();
