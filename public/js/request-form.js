const form = document.getElementById("work-request-form");
const statusEl = document.getElementById("form-status");
const submitBtn = document.getElementById("submit-btn");
const brandAssetsSelect = document.getElementById("brand_assets");
const brandAssetsLinkField = document.getElementById("brand-assets-link-field");
const brandAssetsLink = document.getElementById("brand_assets_link");

function showStatus(kind, message) {
  if (!statusEl) return;
  statusEl.className = `form-status show ${kind}`;
  statusEl.textContent = message;
}

function clearFieldErrors() {
  form.querySelectorAll(".field.invalid").forEach((el) => el.classList.remove("invalid"));
}

function markInvalid(id) {
  const input = document.getElementById(id);
  if (!input) return;
  const field = input.closest(".field");
  if (field) field.classList.add("invalid");
}

function brandAssetsNeedLink() {
  const v = brandAssetsSelect?.value;
  return v === "yes" || v === "partial";
}

function syncBrandAssetsLinkField() {
  if (!brandAssetsLinkField || !brandAssetsLink) return;
  const show = brandAssetsNeedLink();
  brandAssetsLinkField.hidden = !show;
  if (!show) {
    brandAssetsLink.value = "";
    brandAssetsLinkField.classList.remove("invalid");
  }
}

function validate() {
  clearFieldErrors();
  const required = [
    "name",
    "business",
    "phone",
    "email",
    "project_type",
    "description",
    "timeline",
  ];
  let ok = true;
  for (const id of required) {
    const el = document.getElementById(id);
    if (!el || !String(el.value || "").trim()) {
      markInvalid(id);
      ok = false;
    }
  }
  const email = document.getElementById("email");
  if (email && email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
    markInvalid("email");
    ok = false;
  }
  // Referral is optional — never required.
  // Brand asset link required only when they say yes/partial.
  if (brandAssetsNeedLink()) {
    const link = (brandAssetsLink?.value || "").trim();
    if (!link) {
      markInvalid("brand_assets_link");
      ok = false;
    } else {
      try {
        const u = new URL(link);
        if (u.protocol !== "http:" && u.protocol !== "https:") {
          markInvalid("brand_assets_link");
          ok = false;
        }
      } catch {
        markInvalid("brand_assets_link");
        ok = false;
      }
    }
  }
  return ok;
}

function selectLabel(id) {
  const el = document.getElementById(id);
  if (!el || el.tagName !== "SELECT") return el?.value || "";
  return el.options[el.selectedIndex]?.text || el.value;
}

function brandAssetsLabel() {
  return selectLabel("brand_assets");
}

function budgetScopeLabel() {
  const el = document.getElementById("budget_scope");
  if (!el || !el.value) return "(not provided)";
  return el.options[el.selectedIndex]?.text || el.value;
}

function buildPayload() {
  const cfg = window.SIGNTEC_FORM_CONFIG || {};
  const projectType = document.getElementById("project_type");
  const projectLabel = projectType.options[projectType.selectedIndex]?.text || projectType.value;
  const business = document.getElementById("business").value.trim();
  const assetsLink = brandAssetsNeedLink()
    ? (brandAssetsLink?.value || "").trim()
    : "";

  const data = {
    access_key: cfg.web3formsAccessKey || "",
    subject: `SignTec work request — ${projectLabel} — ${business}`,
    from_name: "SignTec Website",
    replyto: document.getElementById("email").value.trim(),
    name: document.getElementById("name").value.trim(),
    business: business,
    phone: document.getElementById("phone").value.trim(),
    email: document.getElementById("email").value.trim(),
    project_type: projectLabel,
    location: document.getElementById("location").value.trim(),
    size_details: document.getElementById("size_details").value.trim(),
    budget_scope: budgetScopeLabel(),
    brand_assets: brandAssetsLabel(),
    brand_assets_link: assetsLink || "(none)",
    timeline: document.getElementById("timeline").value.trim(),
    description: document.getElementById("description").value.trim(),
    referral: document.getElementById("referral").value.trim() || "(not provided)",
    botcheck: form.querySelector('[name="botcheck"]')?.checked ? "1" : "",
  };
  return data;
}

brandAssetsSelect?.addEventListener("change", syncBrandAssetsLinkField);
syncBrandAssetsLinkField();

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validate()) {
    showStatus("error", "Please fill in all required fields.");
    return;
  }

  const bot = form.querySelector('[name="botcheck"]');
  if (bot?.checked) {
    showStatus("error", "Submission blocked.");
    return;
  }

  const cfg = window.SIGNTEC_FORM_CONFIG || {};
  const key = (cfg.web3formsAccessKey || "").trim();
  const payload = buildPayload();

  if (!key) {
    // No key configured — still show client-facing thank-you (no email sent).
    try {
      sessionStorage.setItem(
        "signtec_last_request",
        JSON.stringify({
          project_type: payload.project_type,
          business: payload.business,
          submittedAt: new Date().toISOString(),
        })
      );
    } catch (_) {
      /* ignore */
    }
    window.location.href = "confirmation.html";
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Sending…";
  showStatus("info", "Sending your request…");

  try {
    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ ...payload, access_key: key }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.success === false) {
      throw new Error(json.message || "Send failed");
    }
    try {
      sessionStorage.setItem(
        "signtec_last_request",
        JSON.stringify({
          project_type: payload.project_type,
          business: payload.business,
          submittedAt: new Date().toISOString(),
        })
      );
    } catch (_) {
      /* ignore */
    }
    window.location.href = "confirmation.html";
  } catch (err) {
    showStatus(
      "error",
      "Could not send right now. Please try again in a moment — or use the Contact page if the problem continues."
    );
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit request";
  }
});
