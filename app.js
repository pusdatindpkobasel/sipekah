const URL_GAS = 'https://script.google.com/macros/s/AKfycbzBybyAZbQLm-Irj7kqOJQ0s0_fHfVSeAwCz9_6RQSApweWtQ4iwRwNU5f3ttDhhkFQbw/exec';
let currentUser = null;

async function fetchPegawai() {
  try {
    const res = await fetch(URL_GAS + '?action=getPegawai');
    const data = await res.json();
    const namaPegawaiEl = document.getElementById('namaPegawai');
    namaPegawaiEl.innerHTML = data.map(n => `<option value="${n}">${n}</option>`).join('');
  } catch (err) {
    console.error("Gagal ambil data pegawai", err);
    Swal.fire("Gagal", "Tidak bisa ambil data pegawai", "error");
  }
}

document.addEventListener("DOMContentLoaded", fetchPegawai);

function login() {
  const nama = encodeURIComponent(document.getElementById('namaPegawai').value);
  const password = encodeURIComponent(document.getElementById('password').value);

  fetch(`${URL_GAS}?action=login&nama=${nama}&password=${password}`)
    .then(res => res.json())
    .then(res => {
      if (res.success) {
        currentUser = res.data;
        Swal.fire("Berhasil", "Login sukses!", "success").then(showForm);
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
    Swal.fire("Di luar jam/hari kerja", "Form aktif Senin–Jumat pukul 08.00–22.00", "info");
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

async function uploadFile(file, filename) {
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onload = async function () {
      const base64Data = reader.result.split(',')[1];

      const res = await fetch(URL_GAS, {
        method: "POST",
        body: JSON.stringify({
          action: "uploadFile",
          filename: filename,
          mimeType: file.type,
          data: base64Data,
        }),
        headers: { "Content-Type": "application/json" },
      });

      const json = await res.json();
      resolve(json);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function submitLaporan() {
  const payload = {
    action: "submitLaporan",
    nama: currentUser.nama,
    status: currentUser.status,
    bidang: currentUser.bidang,
  };

  for (let i = 1; i <= 7; i++) {
    const sesi = document.getElementById(`sesi${i}`).value;
    const buktiInput = document.getElementById(`bukti${i}`);
    payload[`sesi${i}`] = sesi;

    if (buktiInput.files.length > 0) {
      const file = buktiInput.files[0];
      const filename = `${currentUser.nama}_sesi${i}_${Date.now()}`;
      try {
        const upload = await uploadFile(file, filename);
        payload[`bukti${i}`] = upload.success ? upload.url : "";
      } catch {
        payload[`bukti${i}`] = "";
      }
    } else {
      payload[`bukti${i}`] = "";
    }
  }

  try {
    const res = await fetch(URL_GAS, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });

    const json = await res.json();
    if (json.success) {
      Swal.fire("Berhasil", "Laporan berhasil dikirim!", "success");
    } else {
      Swal.fire("Gagal", json.message, "error");
    }
  } catch (err) {
    Swal.fire("Kesalahan", "Tidak dapat kirim laporan", "error");
  }
}

function logout() {
  location.reload();
}
