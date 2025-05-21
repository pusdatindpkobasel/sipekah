const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxS9glVdvcS0yfMOeEdYxiTgjLbwc2F_TRwoxGG1dYh_3cAPqzFWnHUOOiLSdFgMZR3rA/exec';

let userData = {}, sesiStatus = {};

window.onload = () => {
  // Cek login user dari localStorage
  const savedUser = localStorage.getItem('userData');
  const loginTimeStr = localStorage.getItem('loginTime');
  const now = new Date();

  if (!savedUser || !loginTimeStr) {
    // Belum login atau data hilang, redirect ke login
    window.location.href = 'login.html';
    return;
  }

  const loginTime = new Date(loginTimeStr);
  const diffMinutes = (now - loginTime) / 1000 / 60;
  if (diffMinutes > 60) {
    // Session expired
    localStorage.removeItem('userData');
    localStorage.removeItem('loginTime');
    window.location.href = 'login.html';
    return;
  }

  userData = JSON.parse(savedUser);

  setupNavigation();  // PENTING: harus dipanggil dulu

  showPage('beranda');
  displayUserInfo();
  renderSimpleCalendar();
  loadSesiStatus();
  setLogoutButton();

  // Pasang event logout di tombol sidebar dan mobile
  document.getElementById('logout-button').addEventListener('click', logout);
  document.getElementById('logout-button-mobile').addEventListener('click', logout);
};

function setupNavigation() {
  const menuLinks = document.querySelectorAll('#sidebar-menu a');
  const pages = document.querySelectorAll('.page-content');
  const sidebar = document.getElementById('sidebar');
  const hamburgerBtn = document.getElementById('hamburger-btn');

  function showPage(pageId) {
    pages.forEach(p => p.style.display = 'none');
    document.getElementById(`page-${pageId}`).style.display = 'block';

    menuLinks.forEach(link => {
      if (link.dataset.page === pageId) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      } else {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
      }
    });
  }

  menuLinks.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      showPage(link.dataset.page);

      if(window.innerWidth <= 768){
        sidebar.classList.remove('show');
        hamburgerBtn.setAttribute('aria-expanded', false);
      }
    });
  });

  hamburgerBtn.addEventListener('click', () => {
    const isShown = sidebar.classList.toggle('show');
    hamburgerBtn.setAttribute('aria-expanded', isShown);
  });

  // Tampilkan halaman Beranda default saat setup
  showPage('beranda');
}

function showPage(pageId) {
  const pages = document.querySelectorAll('.page-content');
  pages.forEach(p => p.style.display = 'none');
  document.getElementById(`page-${pageId}`).style.display = 'block';

  const menuLinks = document.querySelectorAll('#sidebar-menu a');
  menuLinks.forEach(link => {
    if (link.dataset.page === pageId) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    } else {
      link.classList.remove('active');
      link.removeAttribute('aria-current');
    }
  });
}

function displayUserInfo() {
  document.getElementById("info-pegawai").innerHTML = `
    <div class="row mb-1"><div class="col-4 fw-bold">NIP:</div><div class="col-8">${userData.nip}</div></div>
    <div class="row mb-1"><div class="col-4 fw-bold">Sub Bidang:</div><div class="col-8">${userData.subbid}</div></div>
    <div class="row mb-1"><div class="col-4 fw-bold">Status Kepegawaian:</div><div class="col-8">${userData.status}</div></div>
    <div class="row mb-1"><div class="col-4 fw-bold">Golongan:</div><div class="col-8">${userData.golongan}</div></div>
    <div class="row mb-0"><div class="col-4 fw-bold">Jabatan:</div><div class="col-8">${userData.jabatan}</div></div>
  `;
}

function renderSimpleCalendar() {
  const calendarEl = document.getElementById("simple-calendar");
  const calendarTitle = document.getElementById("calendar-title");
  if (!calendarEl || !calendarTitle) return;

  const bulanNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni",
                      "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  calendarTitle.textContent = `Kalender Laporan ${bulanNames[month]} ${year}`;

  fetch(`${WEB_APP_URL}?action=getAllLaporan`)
    .then(res => res.json())
    .then(data => {
      const laporanUser = data.filter(item => item.nama === userData.nama);

      const laporanDates = new Set(
        laporanUser.map(item => {
          const d = new Date(item.timestamp);
          return d.toISOString().split('T')[0];
        })
      );

      const firstDay = new Date(year, month, 1);
      const firstWeekday = firstDay.getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      calendarEl.innerHTML = "";

      const daysOfWeek = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      daysOfWeek.forEach(day => {
        const headerCell = document.createElement("div");
        headerCell.className = "day-cell day-header";
        headerCell.textContent = day;
        calendarEl.appendChild(headerCell);
      });

      for (let i = 0; i < firstWeekday; i++) {
        const emptyCell = document.createElement("div");
        emptyCell.className = "day-cell";
        calendarEl.appendChild(emptyCell);
      }

      for (let day = 1; day <= daysInMonth; day++) {
        const cell = document.createElement("div");
        cell.className = "day-cell";

        const dateStr = new Date(year, month, day).toISOString().split('T')[0];
        cell.textContent = day;

        const today = new Date();
        if (
          day === today.getDate() &&
          month === today.getMonth() &&
          year === today.getFullYear()
        ) {
          cell.classList.add("day-today");
        }

        if (laporanDates.has(dateStr)) {
          cell.classList.add("day-reported");
          cell.title = "Sudah melapor pada tanggal ini";
        }

        calendarEl.appendChild(cell);
      }
    })
    .catch(err => {
      console.error("Gagal load data laporan untuk kalender:", err);
    });
}

function loadSesiStatus() {
  fetch(`${WEB_APP_URL}?action=getLaporan&nama=${userData.nama}`)
    .then(res => res.json())
    .then(data => {
      sesiStatus = data || {};
      renderSesiForm();
    });
}

function getJamSesi(i) {
  const jam = [
    "(07.30–08.30)", "(08.30–09.30)", "(09.30–10.30)", "(10.30–12.00)",
    "(13.00–14.00)", "(14.00–15.00)", "(15.00–16.00)"
  ];
  return jam[i - 1] || "";
}

function renderSesiForm() {
  const wrapper = document.getElementById("sesi-form");
  wrapper.innerHTML = "";

  let totalIsi = 0;

  for (let i = 1; i <= 7; i++) {
    const sudah = sesiStatus[`sesi${i}`];
    const bukti = sesiStatus[`bukti${i}`];
    const div = document.createElement("div");
    div.className = "card card-sesi mb-3";
    div.innerHTML = `
      <div class="card-body">
        <h5 class="card-title">Sesi ${i} ${getJamSesi(i)}</h5>
        ${sudah ? `
          <div class="alert alert-success p-2">
            ✅ Sudah dikirim: ${sudah}
            ${bukti ? `<br><a href="${bukti}" target="_blank">📎 Lihat Bukti</a>` : ""}
            <br><small class="text-muted">Isian sesi tidak bisa diedit ulang.</small>
          </div>
        ` : `
          <textarea id="sesi${i}" class="form-control mb-2" placeholder="Uraian pekerjaan sesi ${i}"></textarea>
          <input type="file" id="file${i}" class="form-control mb-2" accept=".jpg,.jpeg,.png,.pdf" />
          <button class="btn btn-success" onclick="submitSesi(${i})">Kirim Sesi ${i}</button>
        `}
      </div>
    `;
    if (sudah) totalIsi++;
    wrapper.appendChild(div);
  }

  const statusEl = document.getElementById("sesi-status");
  if (statusEl) {
    statusEl.innerHTML = `
      <div class="alert alert-info text-center">
        🔄 ${totalIsi} dari 7 sesi telah diisi
      </div>
    `;
  }
}

async function submitSesi(i) {
  const pekerjaan = document.getElementById(`sesi${i}`).value.trim();
  const file = document.getElementById(`file${i}`).files[0];

  if (!pekerjaan || !file) {
    Swal.fire("Isi uraian & pilih file", "", "warning");
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    Swal.fire("File terlalu besar", "Maksimal ukuran file 2MB", "warning");
    return;
  }

  const allowedExt = ['pdf', 'jpg', 'jpeg', 'png'];
  const ext = file.name.split('.').pop().toLowerCase();
  if (!allowedExt.includes(ext)) {
    Swal.fire("File tidak diizinkan", "Hanya PDF, JPG, JPEG, PNG", "warning");
    return;
  }

  Swal.fire({ title: "Mengirim...", didOpen: () => Swal.showLoading() });

  const reader = new FileReader();
  reader.onload = async function () {
    const base64 = reader.result;
    const filename = `${userData.nama}_Sesi${i}_${new Date().toISOString().split("T")[0]}.${ext}`;

    const formDataUpload = new FormData();
    formDataUpload.append('action', 'uploadFile');
    formDataUpload.append('filename', filename);
    formDataUpload.append('base64', base64);

    try {
      const uploadRes = await fetch(WEB_APP_URL, { method: 'POST', body: formDataUpload });
      const uploadData = await uploadRes.json();

      if (!uploadData.success) {
        Swal.fire("Gagal", "Upload file gagal: " + uploadData.message, "error");
        return;
      }

      const formDataSubmit = new FormData();
      formDataSubmit.append('action', 'submitForm');
      formDataSubmit.append('nama', userData.nama);
      formDataSubmit.append('nip', userData.nip);
      formDataSubmit.append('subbid', userData.subbid);
      formDataSubmit.append('status', userData.status);
      formDataSubmit.append('golongan', userData.golongan);
      formDataSubmit.append('jabatan', userData.jabatan);
      formDataSubmit.append('sesiKey', `sesi${i}`);
      formDataSubmit.append('buktiKey', `bukti${i}`);
      formDataSubmit.append('sesiVal', pekerjaan);
      formDataSubmit.append('buktiVal', uploadData.url);

      const submitRes = await fetch(WEB_APP_URL, { method: 'POST', body: formDataSubmit });
      const result = await submitRes.json();

      if (result.success) {
        Swal.fire("Berhasil", "Sesi berhasil dikirim", "success");
        loadSesiStatus();
      } else {
        Swal.fire("Gagal", "Terjadi kesalahan: " + (result.message || ""), "error");
      }
    } catch (error) {
      Swal.fire("Gagal", "Terjadi kesalahan jaringan.", "error");
    }
  };
  reader.readAsDataURL(file);
}

function logout() {
  localStorage.removeItem('userData');
  localStorage.removeItem('loginTime');
  userData = {};
  sesiStatus = {};
  window.location.href = 'login.html';
}

function setLogoutButton() {
  // logout button sudah event listener nya di window.onload
}
