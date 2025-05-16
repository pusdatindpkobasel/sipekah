const webAppUrl = 'https://script.google.com/macros/s/AKfycbzkuKSY3T2A5jUXyS0djpfZvPSYsdXT2HjwkTZeLmePL0LbFuiycLiADKzGs18EnPpo/exec';

let pegawai = null;
let laporanHariIni = null;

document.addEventListener("DOMContentLoaded", () => {
  loadNamaPegawai();
  setupSesiAccordion();

  document.getElementById("loginBtn").addEventListener("click", handleLogin);
  document.getElementById("logoutBtn").addEventListener("click", handleLogout);
  document.getElementById("dashboardBtn").href = "https://lookerstudio.google.com/reporting/1c845d81-5b0a-41c9-bdfc-39fd342d0a5b"; // Sesuaikan URL dashboard
});

function loadNamaPegawai() {
  fetch(`${webAppUrl}?action=getPegawai`)
    .then(res => res.json())
    .then(data => {
      const select = document.getElementById("nama");
      data.forEach(p => {
        const opt = document.createElement("option");
        opt.value = p.nama;
        opt.textContent = p.nama;
        select.appendChild(opt);
      });
    });
}

function handleLogin() {
  const nama = document.getElementById("nama").value;
  const pin = document.getElementById("pin").value;

  if (!nama || !pin) return alert("Isi semua kolom.");

  fetch(`${webAppUrl}?action=getPegawai`)
    .then(res => res.json())
    .then(data => {
      pegawai = data.find(p => p.nama === nama && p.pin === pin);
      if (pegawai) {
        document.getElementById("loginForm").classList.add("d-none");
        document.getElementById("laporanForm").classList.remove("d-none");
        document.getElementById("pegawaiInfo").innerHTML = `
          <strong>Nama:</strong> ${pegawai.nama}<br/>
          <strong>NIP:</strong> ${pegawai.nip}<br/>
          <strong>Sub Bidang:</strong> ${pegawai.subbidang}
        `;
        getLaporanHariIni();
      } else {
        alert("PIN salah!");
      }
    });
}

function handleLogout() {
  location.reload();
}

function setupSesiAccordion() {
  const container = document.getElementById("sesiAccordion");
  const template = document.getElementById("sesiTemplate");

  for (let i = 1; i <= 7; i++) {
    const clone = template.content.cloneNode(true);
    clone.querySelector(".accordion-header").id = `heading${i}`;
    clone.querySelector(".accordion-button").dataset.bsTarget = `#collapse${i}`;
    clone.querySelector(".accordion-button").setAttribute("aria-controls", `collapse${i}`);
    clone.querySelector(".accordion-button").innerHTML = `Sesi ${i} <span class="badge bg-success ms-2 d-none" id="status${i}">Terkirim</span>`;
    clone.querySelector(".accordion-collapse").id = `collapse${i}`;
    clone.querySelector(".accordion-collapse").setAttribute("aria-labelledby", `heading${i}`);
    clone.querySelector(".accordion-collapse").dataset.bsParent = "#sesiAccordion";
    clone.querySelector("textarea").id = `pekerjaan${i}`;
    clone.querySelector("input[type='file']").id = `bukti${i}`;
    const btn = clone.querySelector("button");
    btn.id = `kirim${i}`;
    btn.textContent = `Kirim Sesi ${i}`;
    btn.addEventListener("click", () => handleSubmitSesi(i));
    container.appendChild(clone);
  }
}

function getLaporanHariIni() {
  fetch(`${webAppUrl}?action=getLaporan&nama=${encodeURIComponent(pegawai.nama)}`)
    .then(res => res.json())
    .then(data => {
      laporanHariIni = data;
      for (let i = 1; i <= 7; i++) {
        if (laporanHariIni[`Sesi${i}`]) {
          document.getElementById(`status${i}`).classList.remove("d-none");
          document.getElementById(`pekerjaan${i}`).disabled = true;
          document.getElementById(`bukti${i}`).disabled = true;
          document.getElementById(`kirim${i}`).disabled = true;
        }
      }
    });
}

function handleSubmitSesi(sesi) {
  const pekerjaan = document.getElementById(`pekerjaan${sesi}`).value.trim();
  const buktiFile = document.getElementById(`bukti${sesi}`).files[0];

  if (!pekerjaan) return alert("Deskripsi pekerjaan wajib diisi.");

  const formData = new FormData();
  formData.append("action", "submitForm");
  formData.append("nama", pegawai.nama);
  formData.append("nip", pegawai.nip);
  formData.append("subbidang", pegawai.subbidang);
  formData.append("sesi", `Sesi${sesi}`);
  formData.append("pekerjaan", pekerjaan);
  if (buktiFile) formData.append("bukti", buktiFile);

  fetch(webAppUrl, { method: "POST", body: formData })
    .then(res => res.json())
    .then(res => {
      if (res.success) {
        alert(`Sesi ${sesi} berhasil dikirim!`);
        document.getElementById(`status${sesi}`).classList.remove("d-none");
        document.getElementById(`pekerjaan${sesi}`).disabled = true;
        document.getElementById(`bukti${sesi}`).disabled = true;
        document.getElementById(`kirim${sesi}`).disabled = true;
      } else {
        alert(res.message || "Gagal menyimpan data.");
      }
    })
    .catch(err => {
      console.error(err);
      alert("Terjadi kesalahan.");
    });
}
