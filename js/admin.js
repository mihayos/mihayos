let adminState = { inquiries: [], newsletters: [], packages: [], blogPosts: [] };
let adminAuthHeader = "";

function getAuthHeader(username, password) {
  return { Authorization: `Basic ${btoa(`${username}:${password}`)}` };
}

async function adminApi(path, options = {}) {
  const headers = {
    "content-type": "application/json",
    ...(adminAuthHeader ? { Authorization: adminAuthHeader } : {}),
    ...(options.headers || {})
  };
  const response = await fetch(path, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) {
    throw new Error(data.message || "Request failed");
  }
  return data;
}

async function refreshAdminData() {
  const data = await adminApi("/api/admin", { method: "GET" });
  adminState = {
    inquiries: data.inquiries || [],
    newsletters: data.newsletters || [],
    packages: data.packages || [],
    blogPosts: data.blogPosts || []
  };
  renderAll();
}

function adminInit() {
  const loginForm = document.getElementById("adminLoginForm");
  const loginError = document.getElementById("adminLoginError");

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = document.getElementById("adminUser").value.trim();
    const pass = document.getElementById("adminPass").value;
    loginError.style.display = "none";

    try {
      adminAuthHeader = getAuthHeader(user, pass).Authorization;
      await refreshAdminData();
      document.getElementById("adminLoginWrap").style.display = "none";
      document.getElementById("adminShell").classList.add("active");
    } catch (error) {
      loginError.textContent = error.message || "Unable to sign in";
      loginError.style.display = "block";
    }
  });

  document.getElementById("adminLogoutBtn").addEventListener("click", () => {
    document.getElementById("adminShell").classList.remove("active");
    document.getElementById("adminLoginWrap").style.display = "flex";
    loginForm.reset();
    adminAuthHeader = "";
  });

  document.querySelectorAll(".admin-nav-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".admin-nav-item").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const target = btn.getAttribute("data-view");
      document.querySelectorAll(".admin-view").forEach((v) => v.classList.remove("active"));
      document.getElementById("view-" + target).classList.add("active");
      document.getElementById("adminTopbarTitle").textContent = btn.textContent.trim();
      document.getElementById("adminSidebar").classList.remove("open");
    });
  });

  document.getElementById("adminMenuToggle").addEventListener("click", () => {
    document.getElementById("adminSidebar").classList.toggle("open");
  });

  document.querySelectorAll("[data-close-modal]").forEach((btn) => {
    btn.addEventListener("click", () => btn.closest(".admin-modal-overlay").classList.remove("open"));
  });

  document.getElementById("addPackageBtn").addEventListener("click", () => {
    document.getElementById("packageModalTitle").textContent = "Add Package";
    document.getElementById("packageForm").reset();
    document.getElementById("packageForm").removeAttribute("data-edit-id");
    document.getElementById("packageModal").classList.add("open");
  });

  document.getElementById("packageForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const editId = form.getAttribute("data-edit-id");
    const payload = {
      name: document.getElementById("pkgName").value,
      duration: document.getElementById("pkgDuration").value,
      price: parseFloat(document.getElementById("pkgPrice").value) || 0,
      imageUrl: "images/gallery/wildebeest-family.jpg"
    };
    try {
      await adminApi("/api/admin", {
        method: "POST",
        body: JSON.stringify(editId ? { action: "update-package", id: parseInt(editId, 10), ...payload } : { action: "create-package", ...payload })
      });
      document.getElementById("packageModal").classList.remove("open");
      adminToast("Package saved to the Cloudflare backend");
      await refreshAdminData();
    } catch (error) {
      adminToast(error.message || "Unable to save package");
    }
  });

  document.getElementById("addBlogBtn").addEventListener("click", () => {
    document.getElementById("blogForm").reset();
    document.getElementById("blogModal").classList.add("open");
  });

  document.getElementById("blogForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("blogTitle").value;
    try {
      await adminApi("/api/admin", {
        method: "POST",
        body: JSON.stringify({ action: "create-post", title, status: "draft" })
      });
      document.getElementById("blogModal").classList.remove("open");
      adminToast("Draft created in the backend");
      await refreshAdminData();
    } catch (error) {
      adminToast(error.message || "Unable to create draft");
    }
  });

  document.getElementById("inquirySearch").addEventListener("input", (e) => {
    renderInquiries(e.target.value.toLowerCase());
  });

  renderAll();
}

function adminToast(msg) {
  const toast = document.getElementById("adminToast");
  toast.querySelector("span").textContent = msg;
  toast.classList.add("show");
  clearTimeout(window._adminToastTimer);
  window._adminToastTimer = setTimeout(() => toast.classList.remove("show"), 3200);
}

function renderAll() {
  renderOverview();
  renderInquiries();
  renderPackages();
  renderBlog();
}

function renderOverview() {
  document.getElementById("statNewInquiries").textContent = adminState.inquiries.filter((i) => i.status === "new").length;
  document.getElementById("statBooked").textContent = adminState.inquiries.filter((i) => i.status === "booked").length;
  document.getElementById("statPackages").textContent = adminState.packages.length;
  document.getElementById("statPosts").textContent = adminState.blogPosts.filter((b) => b.status === "published").length;

  const barWrap = document.getElementById("popularPackagesChart");
  const barData = adminState.packages.length ? adminState.packages.slice(0, 4).map((pkg) => ({ label: pkg.name, value: Math.max(10, Math.round(pkg.price / 100)) })) : [];
  if (!barData.length) {
    barWrap.innerHTML = '<div class="text-muted" style="padding:12px 0;">No packages yet. Add one from the Packages tab.</div>';
  } else {
    const max = Math.max(...barData.map((d) => d.value));
    barWrap.innerHTML = barData.map((d) => `
      <div class="admin-bar-row">
        <div class="admin-bar-label">${d.label}</div>
        <div class="admin-bar-track"><div class="admin-bar-fill" style="width:${(d.value / max * 100).toFixed(0)}%"></div></div>
        <div class="admin-bar-val">${d.value}</div>
      </div>
    `).join("");
  }

  const statusCounts = { new: 0, contacted: 0, booked: 0, closed: 0 };
  adminState.inquiries.forEach((i) => statusCounts[i.status]++);
  const total = adminState.inquiries.length || 1;
  const colors = { new: "#FFD166", contacted: "#0B6E4F", booked: "#073D2C", closed: "#DDD9CE" };
  let cumulative = 0;
  const stops = Object.entries(statusCounts).map(([status, count]) => {
    const start = (cumulative / total) * 100;
    cumulative += count;
    const end = (cumulative / total) * 100;
    return `${colors[status]} ${start}% ${end}%`;
  }).join(", ");
  document.getElementById("statusDonut").style.background = `conic-gradient(${stops})`;
  document.getElementById("donutLegend").innerHTML = Object.entries(statusCounts).map(([status, count]) => `
    <div class="admin-donut-legend-item"><span class="admin-donut-dot" style="background:${colors[status]}"></span> ${status[0].toUpperCase() + status.slice(1)} (${count})</div>
  `).join("");

  const previewBody = document.getElementById("inquiriesTableBodyPreview");
  previewBody.innerHTML = adminState.inquiries.slice(0, 4).map((i) => `
    <tr>
      <td><strong>${i.name}</strong><br><span style="color:var(--c-muted); font-size:0.78rem;">${i.email}</span></td>
      <td>${i.message ? i.message.slice(0, 40) : ""}</td>
      <td>${i.travel_dates || ""}</td>
      <td>${i.created_at ? new Date(i.created_at).toLocaleDateString() : ""}</td>
      <td><span class="admin-badge ${i.status}">${i.status[0].toUpperCase() + i.status.slice(1)}</span></td>
      <td></td>
    </tr>
  `).join("");
}

function renderInquiries(filterText) {
  const tbody = document.getElementById("inquiriesTableBody");
  const rows = adminState.inquiries.filter((i) =>
    !filterText || i.name.toLowerCase().includes(filterText) || (i.message || "").toLowerCase().includes(filterText)
  );
  tbody.innerHTML = rows.map((i) => `
    <tr>
      <td><strong>${i.name}</strong><br><span style="color:var(--c-muted); font-size:0.78rem;">${i.email}</span></td>
      <td>${(i.message || "").slice(0, 80)}</td>
      <td>${i.travel_dates || ""}</td>
      <td>${i.created_at ? new Date(i.created_at).toLocaleDateString() : ""}</td>
      <td>
        <select class="admin-status-select" data-id="${i.id}" onchange="adminUpdateInquiryStatus(${i.id}, this.value)">
          <option value="new" ${i.status === "new" ? "selected" : ""}>New</option>
          <option value="contacted" ${i.status === "contacted" ? "selected" : ""}>Contacted</option>
          <option value="booked" ${i.status === "booked" ? "selected" : ""}>Booked</option>
          <option value="closed" ${i.status === "closed" ? "selected" : ""}>Closed</option>
        </select>
      </td>
      <td>
        <div class="admin-row-actions">
          <button class="admin-icon-btn danger" onclick="adminDeleteInquiry(${i.id})" aria-label="Delete"><i class="fa-solid fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join("") || `<tr><td colspan="6" style="text-align:center; color:var(--c-muted); padding:24px;">No inquiries match that search.</td></tr>`;
}

function renderPackages() {
  const grid = document.getElementById("packagesGrid");
  grid.innerHTML = adminState.packages.map((p) => `
    <div class="admin-item-card">
      <img src="${p.image_url || p.img || "images/gallery/wildebeest-family.jpg"}" alt="${p.name}" loading="lazy">
      <div class="body">
        <h4>${p.name}</h4>
        <div class="meta">${p.duration} · from $${Number(p.price).toLocaleString()}</div>
        <div class="actions">
          <button class="admin-icon-btn" onclick="adminEditPackage(${p.id})" aria-label="Edit"><i class="fa-solid fa-pen"></i></button>
          <button class="admin-icon-btn danger" onclick="adminDeletePackage(${p.id})" aria-label="Delete"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    </div>
  `).join("");
}

function renderBlog() {
  const tbody = document.getElementById("blogTableBody");
  tbody.innerHTML = adminState.blogPosts.map((b) => `
    <tr>
      <td><strong>${b.title}</strong></td>
      <td>${b.created_at ? new Date(b.created_at).toLocaleDateString() : ""}</td>
      <td><span class="admin-badge ${b.status}">${b.status[0].toUpperCase() + b.status.slice(1)}</span></td>
      <td>
        <div class="admin-row-actions">
          <button class="admin-icon-btn" onclick="adminTogglePublish(${b.id})" aria-label="Toggle publish"><i class="fa-solid fa-arrow-up-from-bracket"></i></button>
          <button class="admin-icon-btn danger" onclick="adminDeleteBlog(${b.id})" aria-label="Delete"><i class="fa-solid fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join("");
}

async function adminUpdateInquiryStatus(id, status) {
  try {
    await adminApi("/api/admin", { method: "POST", body: JSON.stringify({ action: "update-status", id, status }) });
    adminToast("Inquiry status updated");
    await refreshAdminData();
  } catch (error) {
    adminToast(error.message || "Unable to update status");
  }
}

async function adminDeleteInquiry(id) {
  try {
    await adminApi("/api/admin", { method: "DELETE", body: JSON.stringify({ action: "delete-inquiry", id }) });
    adminToast("Inquiry deleted");
    await refreshAdminData();
  } catch (error) {
    adminToast(error.message || "Unable to delete inquiry");
  }
}

function adminEditPackage(id) {
  const pkg = adminState.packages.find((p) => p.id === id);
  if (!pkg) return;
  document.getElementById("packageModalTitle").textContent = "Edit Package";
  document.getElementById("pkgName").value = pkg.name;
  document.getElementById("pkgDuration").value = pkg.duration;
  document.getElementById("pkgPrice").value = pkg.price;
  document.getElementById("packageForm").setAttribute("data-edit-id", id);
  document.getElementById("packageModal").classList.add("open");
}

async function adminDeletePackage(id) {
  try {
    await adminApi("/api/admin", { method: "DELETE", body: JSON.stringify({ action: "delete-package", id }) });
    adminToast("Package deleted");
    await refreshAdminData();
  } catch (error) {
    adminToast(error.message || "Unable to delete package");
  }
}

async function adminTogglePublish(id) {
  try {
    const result = await adminApi("/api/admin", { method: "POST", body: JSON.stringify({ action: "toggle-post", id }) });
    adminToast(result.status === "published" ? "Post published" : "Post moved to draft");
    await refreshAdminData();
  } catch (error) {
    adminToast(error.message || "Unable to update post");
  }
}

async function adminDeleteBlog(id) {
  try {
    await adminApi("/api/admin", { method: "DELETE", body: JSON.stringify({ action: "delete-post", id }) });
    adminToast("Post deleted");
    await refreshAdminData();
  } catch (error) {
    adminToast(error.message || "Unable to delete post");
  }
}

document.addEventListener("DOMContentLoaded", adminInit);
