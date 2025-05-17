const URL_GAS = 'https://script.google.com/macros/s/AKfycbyuILYg2W-_P8PhymeRksxOM8XnufOTYXRE4zrr7CSMPDLTD3CzHqG2qAG8txGSyFKxrg/exec';
let currentUser = null;

async function fetchPegawai() {
  const res = await fetch(URL_GAS + '?action=getPegawai');
  const data = await res.json();
  const namaPegawaiEl = document.getElementById('namaPegawai');
  namaPegawaiEl.innerHTML = data.map(n => `<option value="${n}">${n}</option>`).join('');
}

fetchPegawai();

function login() {
  const nama = document.getElementById('namaPegawai').value;
  const password = document.getElementById('password').value;

  fetch(URL_GAS + "?action=login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nama, password })
  })
  .then(res => res.json())
  .then(res => {
    if (res.success) {
      currentUser = res.data;
      showForm();
      Swal.fire("Berhasil", "Login sukses!", "success");
    } else {
      Swal.fire("Gagal Login", res.message, "error");
    }
  })
  .catch(err => {
    console.error("Login error:", err);
    Swal.fire("Kesalahan", "Tidak dapat terhubung ke server", "error");
  });
}


function showForm() {
  const hari = new Date().getDay();
  const jam = new Date().getHours();
  if (hari === 0 || hari === 6 || jam < 8 || jam >= 22) {
    Swal.fire("Di luar jam/hari kerja", "Form hanya aktif Senin–Jumat pukul 08.00–22.00", "info");
    return;
  }

  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('formLaporan').style.display = 'block';
  document.getElementById('infoUser').innerText = `${currentUser.nama} | ${currentUser.status} | ${currentUser.bidang}`;

  let html = '';
  for (let i = 1; i <= 7; i++) {
    html += `
      <div class="mb-2">
        <label>Sesi ${i}</label>
        <textarea id="sesi${i}" class="form-control mb-1" placeholder="Deskripsi..."></textarea>
        <input type="file" id="bukti${i}" class="form-control">
      </div>`;
  }
  document.getElementById('formSesi').innerHTML = html;
}

async function submitLaporan() {
  const data = {
    nama: currentUser.nama,
    status: currentUser.status,
    bidang: currentUser.bidang
  };

  for (let i = 1; i <= 7; i++) {
    data[`sesi${i}`] = document.getElementById(`sesi${i}`).value;
    const fileInput = document.getElementById(`bukti${i}`);
    if (fileInput.files.length > 0) {
      const file = fileInput.files[0];
      const form = new FormData();
      form.append("file", file);
      form.append("filename", `${currentUser.nama}_sesi${i}_${Date.now()}`);
      const upload = await fetch(URL_GAS + "?action=uploadFile", {
        method: "POST",
        body: form
      }).then(r => r.json());
      data[`bukti${i}`] = upload.url;
    } else {
      data[`bukti${i}`] = "";
    }
  }

  fetch(URL_GAS + "?action=submitLaporan", {
    method: "POST",
    body: JSON.stringify(data)
  }).then(r => r.json()).then(res => {
    if (res.success) {
      Swal.fire("Berhasil", "Laporan berhasil disimpan!", "success");
    } else {
      Swal.fire("Gagal", "Terjadi kesalahan saat menyimpan", "error");
    }
  });
}

function logout() {
  location.reload();
}
