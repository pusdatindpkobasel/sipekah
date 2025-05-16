const BASE_URL = 'https://script.google.com/macros/s/AKfycbyO44xnsqQotNWE7eaUKSV64c9QqIGC8yQr-6FlaXqt29geP7Ai71MxFTb1h8yYtfs/exec';

document.addEventListener('DOMContentLoaded', () => {
  loadPegawaiDropdown();

  document.getElementById('btnLogin').addEventListener('click', loginPegawai);
  document.getElementById('btnLogout').addEventListener('click', resetUI);
});

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
        tampilkanFormSesi(data.laporanHariIni || {}, nama);
      } else {
        Swal.fire('Gagal Login', data.message || 'Nama atau PIN salah', 'error');
      }
    })
    .catch(() => Swal.fire('Error', 'Gagal menghubungi server', 'error'));
}

function tampilkanDataPegawai(pegawai) {
  const card = document.getElementById('pegawaiCard');
  card.classList.remove('d-none');

  card.innerHTML = `
    <div class="card p-3">
      <h5>Data Pegawai</h5>
      ${['Nama', 'NIP', 'Sub Bidang', 'Status Kepegawaian', 'Golongan', 'Jabatan'].map((label, i) => `
        <div class="row mb-1">
          <div class="col-4 col-md-3 fw-semibold">${label}</div>
          <div class="col-8 col-md-9">${Object.values(pegawai)[i]}</div>
        </div>`).join('')}
    </div>
  `;

  document.getElementById('formLaporan').classList.remove('d-none');
  document.getElementById('btnLogout').classList.remove('d-none');
  document.getElementById('btnDashboard').classList.remove('d-none');
  document.getElementById('btnLogin').classList.add('d-none');
  document.getElementById('namaPegawai').disabled = true;
  document.getElementById('password').disabled = true;
}

// Tambahan: Sesi yang dikirim tidak bisa diisi ulang
function tampilkanFormSesi(laporan, nama) {
  const container = document.getElementById('formSesiContainer');
  container.innerHTML = '';

  for (let i = 1; i <= 7; i++) {
    const sesiKey = `sesi${i}`;
    const buktiKey = `bukti${i}`;
    const sudahDiisi = laporan[sesiKey] && laporan[sesiKey].trim() !== '';

    const card = document.createElement('div');
    card.className = `card p-3 mb-3 border ${sudahDiisi ? 'border-success bg-light' : 'border-secondary'}`;

    card.innerHTML = `
      <h6 class="fw-bold">Sesi ${i}</h6>
      <div class="mb-2">
        <label>Uraian Kegiatan</label>
        <textarea class="form-control" rows="2" name="${sesiKey}" ${sudahDiisi ? 'disabled' : ''}>${sudahDiisi ? laporan[sesiKey] : ''}</textarea>
      </div>
      <div class="mb-2">
        <label>Bukti Dukung</label>
        <input type="file" class="form-control" name="${buktiKey}" accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" ${sudahDiisi ? 'disabled' : ''}>
      </div>
      <button class="btn btn-${sudahDiisi ? 'success' : 'primary'} w-100 btnSubmitSesi" data-sesi="${i}" ${sudahDiisi ? 'disabled' : ''}>
        ${sudahDiisi ? 'Terkirim' : 'Kirim'}
      </button>
    `;
    container.appendChild(card);
  }

  // Tambah event listener tombol submit per sesi
  document.querySelectorAll('.btnSubmitSesi').forEach(btn => {
    btn.addEventListener('click', e => {
      const sesi = e.target.dataset.sesi;
      submitSesi(sesi, nama);
    });
  });
}

function submitSesi(sesiNumber, nama) {
  const sesiKey = `sesi${sesiNumber}`;
  const buktiKey = `bukti${sesiNumber}`;
  const textarea = document.querySelector(`textarea[name="${sesiKey}"]`);
  const fileInput = document.querySelector(`input[name="${buktiKey}"]`);
  const uraian = textarea.value.trim();
  const file = fileInput.files[0];

  if (!uraian) {
    Swal.fire('Gagal', `Uraian kegiatan untuk sesi ${sesiNumber} belum diisi.`, 'warning');
    return;
  }

  const formData = new FormData();
  formData.append('action', 'submit');
  formData.append('nama', nama);
  formData.append('sesi', sesiNumber);
  formData.append('uraian', uraian);
  if (file) formData.append('bukti', file);

  Swal.fire({
    title: 'Menyimpan data...',
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  fetch(BASE_URL, {
    method: 'POST',
    body: formData
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        Swal.fire('Terkirim', `Laporan sesi ${sesiNumber} berhasil disimpan.`, 'success');
        //  loginPegawai();Refresh status form tanpa reload halaman penuh
        tampilkanFormSesi(data.laporanHariIni, nama);
      } else {
        Swal.fire('Gagal', data.message || 'Gagal menyimpan data', 'error');
      }
    })
    .catch(() => Swal.fire('Error', 'Gagal menghubungi server', 'error'));
}

function resetUI() {
  location.reload(); // tetap gunakan reload untuk reset total
}
