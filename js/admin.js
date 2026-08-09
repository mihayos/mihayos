/* =========================================================
   MIHAYO'S SAFARIS — admin.js
   IMPORTANT — read before treating this as a real back office:
   This is a front-end DEMO ONLY. There is no server, no database,
   and no real authentication behind it:
     - The login check below is a plain if-statement sitting in
       JavaScript that ships to the browser — anyone can read the
       "password" in view-source in about five seconds. This is
       NOT secure and must never gate real data in production.
     - All bookings, inquiries, packages, and blog rows below are
       illustrative sample data, not real customer submissions —
       nothing on the public site actually writes into this screen.
     - Every edit/add/delete here only changes an in-memory array
       for this browser tab. Refresh the page and it's gone.
   To make this real: stand up a backend (Node/Express, etc.) with
   real authentication (hashed passwords or SSO), a database, and
   REST/GraphQL endpoints, then swap the DEMO_DATA arrays below for
   fetch() calls against that API.
   ========================================================= */

const ADMIN_DEMO_USER = "mihayosafaris";
const ADMIN_DEMO_PASS = "admin";

/* ---------------- Demo data (in-memory only) ---------------- */
let inquiries = [
  { id: 1, name: "Laura Mensah", email: "laura.m@example.com", package: "Classic Northern Circuit", dates: "Sep 2026", status: "new", received: "2 hours ago" },
  { id: 2, name: "Daniel Kwan", email: "d.kwan@example.com", package: "Kilimanjaro + Beach", dates: "Jan 2027", status: "contacted", received: "Yesterday" },
  { id: 3, name: "Amara Obi", email: "amara.obi@example.com", package: "Migration River Crossing", dates: "Jul 2026", status: "booked", received: "3 days ago" },
  { id: 4, name: "Priya Shah", email: "priya.shah@example.com", package: "Family Safari", dates: "Dec 2026", status: "new", received: "5 days ago" },
  { id: 5, name: "Marcus Tanaka", email: "m.tanaka@example.com", package: "Budget Camping Safari", dates: "Oct 2026", status: "closed", received: "1 week ago" },
  { id: 6, name: "Sofia Alves", email: "sofia.a@example.com", package: "Southern Circuit Escape", dates: "Aug 2026", status: "contacted", received: "1 week ago" },
];

let packages = [
  { id: 1, name: "Classic Northern Circuit", duration: "6 days", price: 2450, img: "images/gallery/kili-zebras-wildebeest.jpg" },
  { id: 2, name: "Migration River Crossing", duration: "8 days", price: 3890, img: "images/gallery/zebra-wildebeest-plains.jpg" },
  { id: 3, name: "Kilimanjaro + Beach", duration: "10 days", price: 3150, img: "images/gallery/giraffes-kilimanjaro.jpg" },
  { id: 4, name: "Southern Circuit Escape", duration: "7 days", price: 2980, img: "images/gallery/sunset-acacia.jpg" },
];

let blogPosts = [
  { id: 1, title: "Best Time to Visit Tanzania, Month by Month", status: "published", date: "Jun 12, 2026" },
  { id: 2, title: "The Packing List We Actually Give Our Guests", status: "published", date: "May 28, 2026" },
  { id: 3, title: "Machame vs Lemosho: Which Route Fits You", status: "published", date: "May 9, 2026" },
  { id: 4, title: "A Field Guide to Tanzania's Big Five", status: "published", date: "Apr 22, 2026" },
  { id: 5, title: "Zanzibar Travel Guide: Which Beach Fits Your Trip", status: "published", date: "Apr 3, 2026" },
  { id: 6, title: "Kilimanjaro Altitude Sickness: What Actually Helps", status: "published", date: "Mar 15, 2026" },
  { id: 7, title: "Ngorongoro Crater in One Day: Is It Enough?", status: "draft", date: "Not published" },
];

let nextInquiryId = 7, nextPackageId = 5, nextBlogId = 8;

/* ---------------- Login ---------------- */
function adminInit() {
  const loginForm = document.getElementById("adminLoginForm");
  const loginError = document.getElementById("adminLoginError");

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const user = document.getElementById("adminUser").value.trim();
    const pass = document.getElementById("adminPass").value;
    if (user === ADMIN_DEMO_USER && pass === ADMIN_DEMO_PASS) {
      loginError.style.display = "none";
      document.getElementById("adminLoginWrap").style.display = "none";
      document.getElementById("adminShell").classList.add("active");
      renderAll();
    } else {
      loginError.textContent = "Incorrect email or password. Use the demo credentials shown below.";
      loginError.style.display = "block";
    }
  });

  document.getElementById("adminLogoutBtn").addEventListener("click", () => {
    document.getElementById("adminShell").classList.remove("active");
    document.getElementById("adminLoginWrap").style.display = "flex";
    loginForm.reset();
  });

  // Nav switching
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

  // Modal close handlers
  document.querySelectorAll("[data-close-modal]").forEach((btn) => {
    btn.addEventListener("click", () => btn.closest(".admin-modal-overlay").classList.remove("open"));
  });

  // Add package
  document.getElementById("addPackageBtn").addEventListener("click", () => {
    document.getElementById("packageModalTitle").textContent = "Add Package";
    document.getElementById("packageForm").reset();
    document.getElementById("packageForm").removeAttribute("data-edit-id");
    document.getElementById("packageModal").classList.add("open");
  });
  document.getElementById("packageForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const editId = e.target.getAttribute("data-edit-id");
    const name = document.getElementById("pkgName").value;
    const duration = document.getElementById("pkgDuration").value;
    const price = parseFloat(document.getElementById("pkgPrice").value) || 0;
    if (editId) {
      const pkg = packages.find((p) => p.id === parseInt(editId, 10));
      if (pkg) { pkg.name = name; pkg.duration = duration; pkg.price = price; }
      adminToast("Package updated (demo only — not saved to the live site)");
    } else {
      packages.push({ id: nextPackageId++, name, duration, price, img: "images/gallery/wildebeest-family.jpg" });
      adminToast("Package added (demo only — not saved to the live site)");
    }
    document.getElementById("packageModal").classList.remove("open");
    renderPackages();
  });

  // Add blog post
  document.getElementById("addBlogBtn").addEventListener("click", () => {
    document.getElementById("blogForm").reset();
    document.getElementById("blogModal").classList.add("open");
  });
  document.getElementById("blogForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const title = document.getElementById("blogTitle").value;
    blogPosts.unshift({ id: nextBlogId++, title, status: "draft", date: "Not published" });
    document.getElementById("blogModal").classList.remove("open");
    adminToast("Draft created (demo only — not saved to the live site)");
    renderBlog();
  });

  // Search filter (inquiries)
  document.getElementById("inquirySearch").addEventListener("input", (e) => {
    renderInquiries(e.target.value.toLowerCase());
  });

  renderAll();
}

/* ---------------- Toast ---------------- */
function adminToast(msg) {
  const toast = document.getElementById("adminToast");
  toast.querySelector("span").textContent = msg;
  toast.classList.add("show");
  clearTimeout(window._adminToastTimer);
  window._adminToastTimer = setTimeout(() => toast.classList.remove("show"), 3200);
}

/* ---------------- Renderers ---------------- */
function renderAll() {
  renderOverview();
  renderInquiries();
  renderPackages();
  renderBlog();
}

function renderOverview() {
  document.getElementById("statNewInquiries").textContent = inquiries.filter((i) => i.status === "new").length;
  document.getElementById("statBooked").textContent = inquiries.filter((i) => i.status === "booked").length;
  document.getElementById("statPackages").textContent = packages.length;
  document.getElementById("statPosts").textContent = blogPosts.filter((b) => b.status === "published").length;

  // Popular packages bar chart (demo counts)
  const barData = [
    { label: "Classic Northern Circuit", value: 38 },
    { label: "Kilimanjaro + Beach", value: 27 },
    { label: "Migration River Crossing", value: 21 },
    { label: "Southern Circuit Escape", value: 14 },
  ];
  const max = Math.max(...barData.map((d) => d.value));
  const barWrap = document.getElementById("popularPackagesChart");
  barWrap.innerHTML = barData.map((d) => `
    <div class="admin-bar-row">
      <div class="admin-bar-label">${d.label}</div>
      <div class="admin-bar-track"><div class="admin-bar-fill" style="width:${(d.value / max * 100).toFixed(0)}%"></div></div>
      <div class="admin-bar-val">${d.value}</div>
    </div>
  `).join("");

  // Inquiry status donut
  const statusCounts = { new: 0, contacted: 0, booked: 0, closed: 0 };
  inquiries.forEach((i) => statusCounts[i.status]++);
  const total = inquiries.length || 1;
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

  // Recent inquiries preview (first 4)
  const previewBody = document.getElementById("inquiriesTableBodyPreview");
  previewBody.innerHTML = inquiries.slice(0, 4).map((i) => `
    <tr>
      <td><strong>${i.name}</strong><br><span style="color:var(--c-muted); font-size:0.78rem;">${i.email}</span></td>
      <td>${i.package}</td>
      <td>${i.dates}</td>
      <td>${i.received}</td>
      <td><span class="admin-badge ${i.status}">${i.status[0].toUpperCase() + i.status.slice(1)}</span></td>
      <td></td>
    </tr>
  `).join("");
}

function renderInquiries(filterText) {
  const tbody = document.getElementById("inquiriesTableBody");
  const rows = inquiries.filter((i) =>
    !filterText || i.name.toLowerCase().includes(filterText) || i.package.toLowerCase().includes(filterText)
  );
  tbody.innerHTML = rows.map((i) => `
    <tr>
      <td><strong>${i.name}</strong><br><span style="color:var(--c-muted); font-size:0.78rem;">${i.email}</span></td>
      <td>${i.package}</td>
      <td>${i.dates}</td>
      <td>${i.received}</td>
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
  grid.innerHTML = packages.map((p) => `
    <div class="admin-item-card">
      <img src="${p.img}" alt="${p.name}" loading="lazy">
      <div class="body">
        <h4>${p.name}</h4>
        <div class="meta">${p.duration} · from $${p.price.toLocaleString()}</div>
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
  tbody.innerHTML = blogPosts.map((b) => `
    <tr>
      <td><strong>${b.title}</strong></td>
      <td>${b.date}</td>
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

/* ---------------- Actions (all in-memory / demo only) ---------------- */
function adminUpdateInquiryStatus(id, status) {
  const inquiry = inquiries.find((i) => i.id === id);
  if (inquiry) inquiry.status = status;
  adminToast("Status updated (demo only — not saved anywhere real)");
  renderOverview();
}
function adminDeleteInquiry(id) {
  inquiries = inquiries.filter((i) => i.id !== id);
  adminToast("Inquiry removed from this view (demo only)");
  renderInquiries();
  renderOverview();
}
function adminEditPackage(id) {
  const pkg = packages.find((p) => p.id === id);
  if (!pkg) return;
  document.getElementById("packageModalTitle").textContent = "Edit Package";
  document.getElementById("pkgName").value = pkg.name;
  document.getElementById("pkgDuration").value = pkg.duration;
  document.getElementById("pkgPrice").value = pkg.price;
  document.getElementById("packageForm").setAttribute("data-edit-id", id);
  document.getElementById("packageModal").classList.add("open");
}
function adminDeletePackage(id) {
  packages = packages.filter((p) => p.id !== id);
  adminToast("Package removed from this view (demo only)");
  renderPackages();
  renderOverview();
}
function adminTogglePublish(id) {
  const post = blogPosts.find((b) => b.id === id);
  if (post) {
    post.status = post.status === "published" ? "draft" : "published";
    if (post.status === "published" && post.date === "Not published") post.date = "Just now";
  }
  adminToast("Post status changed (demo only — the real blog page is unaffected)");
  renderBlog();
  renderOverview();
}
function adminDeleteBlog(id) {
  blogPosts = blogPosts.filter((b) => b.id !== id);
  adminToast("Post removed from this view (demo only)");
  renderBlog();
  renderOverview();
}

document.addEventListener("DOMContentLoaded", adminInit);
