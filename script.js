const BASE_URL = 'https://script.google.com/macros/s/AKfycbyO44xnsqQotNWE7eaUKSV64c9QqIGC8yQr-6FlaXqt29geP7Ai71MxFTb1h8yYtfs/exec';

document.addEventListener('DOMContentLoaded', () => {
  loadPegawaiDropdown();

  document.getElementById('btnLogin').addEventListener('click', loginPegawai);
  document.getElementById('btnLogout').addEventListener('click', resetUI);
  document.getElementById('formLaporan').addEventListener('submit', handleSubmit);
});

// Load daftar nama pegawai
function loadPegawaiDropdown() {
  fetch(`${BASE_URL}?action=getPegawai`)
    .then(res => res.json())
    .then(data => {
      const select = document.getElementById('namaPegawai');
      data.forEach(p => {
        const option = document.createElement('option');
        option.value = p.nama;
        option.textContent = p.nama;
        select.appendChild(option);
      });
    });
}

// Proses login
function loginPegawai() {
  const nama = document.getElementById('namaPegawai').value;
  const pass = document.getElementById('password').value;
  if (!nama || !pass) {
    Swal.fire('Lengkapi Login', 'Nama dan PIN wajib diisi', 'warning');
    return;
  }

  Swal.fire({
    title: 'Memproses login...',
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  fetch(`${BASE_URL}?action=login`, {
    method: 'POST',
    body: JSON.stringify({ nama, password: pass }),
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        Swal.fire('Berhasil', 'Login berhasil. Memuat data pegawai...', 'success');
        tampilkanDataPegawai(data.pegawai);
        tampilkanFormSesi(data.laporanHariIni);
      } else {
        Swal.fire('Gagal Login', data.message || 'Nama atau PIN salah', 'error');
      }
    })
    .catch(() => Swal.fire('Error', 'Gagal menghubungi server', 'error'));
}

// Tampilkan info pegawai
function tampilkanDataPegawai(pegawai) {
  document.getElementById('pegawaiCard').classList.remove('d-none');
  document.getElementById("dataPegawaiContainer").innerHTML = `
  <div class="card p-3">
    <h5>Data Pegawai</h5>
    
    <div class="row mb-1">
      <div class="col-4 col-md-3 fw-semibold">Nama</div>
      <div class="col-8 col-md-9">${pegawai.nama}</div>
    </div>
    
    <div class="row mb-1">
      <div class="col-4 col-md-3 fw-semibold">NIP</div>
      <div class="col-8 col-md-9">${pegawai.nip}</div>
    </div>
    
    <div class="row mb-1">
      <div class="col-4 col-md-3 fw-semibold">Sub Bidang</div>
      <div class="col-8 col-md-9">${pegawai.bidang}</div>
    </div>
    
    <div class="row mb-1">
      <div class="col-4 col-md-3 fw-semibold">Status Kepegawaian</div>
      <div class="col-8 col-md-9">${pegawai.status}</div>
    </div>
    
    <div class="row mb-1">
      <div class="col-4 col-md-3 fw-semibold">Golongan</div>
      <div class="col-8 col-md-9">${pegawai.golongan}</div>
    </div>
    
    <div class="row mb-1">
      <div class="col-4 col-md-3 fw-semibold">Jabatan</div>
      <div class="col-8 col-md-9">${pegawai.jabatan}</div>
    </div>
    
  </div>
`;
  document.getElementById('formLaporan').classList.remove('d-none');
  document.getElementById('btnLogout').classList.remove('d-none');
  document.getElementById('btnDashboard').classList.remove('d-none');
  document.getElementById('btnLogin').classList.add('d-none');
  document.getElementById('namaPegawai').disabled = true;
  document.getElementById('password').disabled = true;
}

// Reset UI setelah logout
function resetUI() {
  location.reload(); // refresh page untuk reset semua state
}

// Generate card isian sesi 1–7
function tampilkanFormSesi(laporanHariIni) {
  const container = document.getElementById('formSesiContainer');
  container.innerHTML = '';
  for (let i = 1; i <= 7; i++) {
    const sesiKey = `sesi${i}`;
    const buktiKey = `bukti${i}`;
    const sudahDiisi = laporanHariIni && laporanHariIni[sesiKey];

    const card = document.createElement('div');
    card.className = `card-sesi ${sudahDiisi ? 'disabled' : ''}`;
    card.innerHTML = `
      <h6>Sesi ${i}</h6>
      <div class="mb-2">
        <label>Uraian Kegiatan</label>
        <textarea class="form-control" rows="2" name="${sesiKey}" ${sudahDiisi ? 'disabled' : ''}></textarea>
      </div>
      <div>
        <label>Bukti Dukung</label>
        <input type="file" class="form-control" name="${buktiKey}" accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" ${sudahDiisi ? 'disabled' : ''}>
      </div>
    `;
    container.appendChild(card);
  }
}

// Submit form
function handleSubmit(e) {
  e.preventDefault();
  const formData = new FormData(document.getElementById('formLaporan'));
  formData.append('nama', document.getElementById('namaPegawai').value);

  Swal.fire({
    title: 'Menyimpan data...',
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  fetch(`${BASE_URL}?action=submit`, {
    method: 'POST',
    body: formData
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        Swal.fire('Berhasil', 'Data berhasil disimpan!', 'success').then(() => {
          loginPegawai(); // refresh tampilan form sesi
        });
      } else {
        Swal.fire('Gagal', data.message || 'Gagal menyimpan data', 'error');
      }
    })
    .catch(() => Swal.fire('Error', 'Gagal menghubungi server', 'error'));
}
