// === script.js ===
const API_URL = "https://script.google.com/macros/s/AKfycbyinaQMZ_9q3vnsUBDxXGpCsTI1QS_GwqI5p3fZVu-qn7QqjG6JOXBVD92ntm6_yImJ6w/exec";
let dataPegawai = [];
let namaLogin = "";

// Load data pegawai
fetch(`${API_URL}?action=getPegawai`)
  .then((res) => res.json())
  .then((data) => {
    dataPegawai = data;
    const select = document.getElementById("namaPegawai");
    data.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.nama;
      opt.textContent = p.nama;
      select.appendChild(opt);
    });
  });

// Login
const btnLogin = document.getElementById("btnLogin");
btnLogin.addEventListener("click", () => {
  const nama = document.getElementById("namaPegawai").value;
  const pin = document.getElementById("password").value;
  const pegawai = dataPegawai.find((p) => p.nama === nama && p.pin === pin);

  if (pegawai) {
    namaLogin = nama;
    document.getElementById("login-card").classList.add("d-none");
    document.getElementById("formLaporan").classList.remove("d-none");
    document.getElementById("btnLogout").classList.remove("d-none");
    document.getElementById("btnDashboard").classList.remove("d-none");
    loadLaporan(nama);
  } else {
    Swal.fire("Gagal", "Nama atau PIN salah", "error");
  }
});

// Logout
const btnLogout = document.getElementById("btnLogout");
btnLogout.addEventListener("click", () => location.reload());

// Load laporan dari backend
function loadLaporan(nama) {
  fetch(`${API_URL}?action=getLaporan&nama=${encodeURIComponent(nama)}`)
    .then((res) => res.json())
    .then((data) => renderForm(nama, data));
}

// Render form per sesi
function renderForm(nama, laporan) {
  const container = document.getElementById("formSesiContainer");
  container.innerHTML = "";
  for (let i = 1; i <= 7; i++) {
    const sudah = laporan[`Sesi ${i}`];
    const card = document.createElement("div");
    card.className = "card mb-3 shadow";
    card.innerHTML = `
      <div class="card-body">
        <h5 class="card-title">Sesi ${i}</h5>
        <textarea class="form-control mb-2 inputKegiatan" rows="2" placeholder="Uraian pekerjaan sesi ${i}" ${sudah ? "readonly" : ""}>${sudah ? sudah.kegiatan : ""}</textarea>
        <input type="file" class="form-control mb-2 inputFile" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" ${sudah ? "disabled" : ""} />
        <button class="btn btn-${sudah ? "success" : "primary"} w-100 btnSubmitSesi" data-sesi="${i}" ${sudah ? "disabled" : ""}>
          ${sudah ? "Terkirim" : "Kirim"}
        </button>
      </div>`;
    container.appendChild(card);
  }

  document.querySelectorAll(".btnSubmitSesi").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const sesi = e.target.dataset.sesi;
      const cardBody = e.target.closest(".card-body");
      const kegiatan = cardBody.querySelector(".inputKegiatan").value.trim();
      const file = cardBody.querySelector(".inputFile").files[0];

      if (!kegiatan) {
        Swal.fire("Gagal", "Uraian pekerjaan wajib diisi", "warning");
        return;
      }

      Swal.fire({
        title: "Menyimpan...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      let fileId = "";
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("nama", namaLogin);
        formData.append("sesi", sesi);

        const uploadRes = await fetch(`${API_URL}?action=uploadFile`, {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        fileId = uploadData.fileId || "";
      }

      const payload = {
        nama: namaLogin,
        sesi,
        kegiatan,
        fileId,
      };

      const simpanRes = await fetch(`${API_URL}?action=submitForm`, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      });

      const simpanData = await simpanRes.json();

      if (simpanData.status === "success") {
        Swal.fire("Berhasil", "Laporan sesi berhasil dikirim", "success");
        loadLaporan(namaLogin);
      } else {
        Swal.fire("Gagal", simpanData.message || "Terjadi kesalahan", "error");
      }
    });
  });
}
