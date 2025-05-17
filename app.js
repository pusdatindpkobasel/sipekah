const URL_GAS = 'https://script.google.com/macros/s/AKfycbzBybyAZbQLm-Irj7kqOJQ0s0_fHfVSeAwCz9_6RQSApweWtQ4iwRwNU5f3ttDhhkFQbw/exec';
let currentUser = null;

document.addEventListener("DOMContentLoaded", () => {
  fetchPegawai();
});

async function fetchPegawai() {
  try {
    const res = await fetch(`${URL_GAS}?action=getPegawai`);
    const data = await res.json();
    const namaPegawaiEl = document.getElementById('namaPegawai');
    namaPegawaiEl.innerHTML = data.map(n => `<option value="${n}">${n}</option>`).join('');
  } catch (err) {
    console.error("Gagal ambil data pegawai", err);
    Swal.fire("Gagal", "Tidak bisa ambil data pegawai", "error");
  }
}

function login() {
  const nama = encodeURIComponent(document.getElementById('namaPegawai').value);
  const password = encodeURIComponent(document.getElementById('password').value);

  fetch(`${URL_GAS}?action=login&nama=${nama}&password=${password}`)
    .then(res => res.json())
    .then(res => {
      if (res.success) {
        currentUser = res.data;
        Swal.fire("Berhasil", "Login sukses!", "success").then(() => showForm());
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
  const formData = new FormData();
  formData.append("action", "submitLaporan");
  formData.append("nama", currentUser.nama);
  formData.append("status", currentUser.status);
  formData.append("bidang", currentUser.bidang);

  for (let i = 1; i <= 7; i++) {
    const sesi = document.getElementById(`sesi${i}`).value;
    formData.append(`sesi${i}`, sesi);

    const buktiInput = document.getElementById(`bukti${i}`);
    if (buktiInput.files.length > 0) {
      const file = buktiInput.files[0];
      const filename = `${currentUser.nama}_sesi${i}_${Date.now()}`;
      try {
        const resUpload = await fetch(`${URL_GAS}?action=uploadFile&filename=${encodeURIComponent(filename)}`, {
          method: "POST",
          body: file,
          headers: { "Content-Type": file.type },
        });
        const upload = await resUpload.json();
        formData.append(`bukti${i}`, upload.success ? upload.url : "");
      } catch (e) {
        formData.append(`bukti${i}`, "");
      }
    } else {
      formData.append(`bukti${i}`, "");
    }
  }

  const res = await fetch(URL_GAS, { method: "POST", body: formData });
  const json = await res.json();
  if (json.success) {
    Swal.fire("Berhasil", "Laporan berhasil disimpan!", "success");
  } else {
    Swal.fire("Gagal", json.message || "Gagal menyimpan laporan", "error");
  }
}

function logout() {
  location.reload();
}
