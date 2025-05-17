// script.js terbaru dengan sistem AJAX + update kolom dinamis

const BASE_URL = 'https://script.google.com/macros/s/AKfycbwVu3BefQJKI30vGuMTh6w6p9AXjsJnKHb7ChN77TY5m46UZPsKtnUObSXN2uuuhUBk/exec';
let pegawaiAktif = null;

window.addEventListener('load', () => {
  // saat load halaman
fetch(`${BASE_URL}?action=getPegawai`)
  .then(res => res.json())
  .then(data => {
    const select = document.getElementById('namaPegawai');
    select.innerHTML = '<option value="">-- Pilih Nama --</option>';
    data.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item.NamaPegawai;
      opt.textContent = item.NamaPegawai;
      select.appendChild(opt);
    });
  })
  .catch(() => Swal.fire('Error', 'Gagal memuat data pegawai', 'error'));

// saat login
document.getElementById('btnLogin').addEventListener('click', () => {
  const nama = document.getElementById('namaPegawai').value;
  const pin = document.getElementById('password').value;

  if (!nama || !pin) {
    Swal.fire('Error', 'Nama dan PIN wajib diisi!', 'error');
    return;
  }

  fetch(`${BASE_URL}?action=getPegawai`)
    .then(res => res.json())
    .then(data => {
      const found = data.find(p => p['Nama Pegawai'] === nama && p.password === pin);
      if (!found) return Swal.fire('Gagal Login', 'Nama atau PIN salah.', 'error');

      pegawaiAktif = found;
      document.getElementById('login-card').classList.add('d-none');
      document.getElementById('btnLogout').classList.remove('d-none');
      document.getElementById('btnDashboard').classList.remove('d-none');
      document.getElementById('formLaporan').classList.remove('d-none');

      tampilkanFormSesi();
    });
});


document.getElementById('btnLogout').addEventListener('click', () => {
  location.reload();
});

function tampilkanFormSesi() {
  fetch(`${BASE_URL}?action=getLaporan&nama=${encodeURIComponent(pegawaiAktif.nama)}`)
    .then(res => res.json())
    .then(laporan => {
      const container = document.getElementById('formSesiContainer');
      container.innerHTML = '';
      for (let i = 1; i <= 7; i++) {
        const sesiKey = `Sesi ${i}`;
        const sudahDiisi = laporan[sesiKey] && laporan[sesiKey].kegiatan;

        const card = document.createElement('div');
        card.className = 'card mb-3';
        card.innerHTML = `
          <div class="card-header bg-${sudahDiisi ? 'success' : 'primary'} text-white">
            ${sesiKey} ${sudahDiisi ? '(Terkirim)' : ''}
          </div>
          <div class="card-body">
            <div class="mb-2">
              <label>Kegiatan</label>
              <input type="text" class="form-control kegiatan-input" id="kegiatan-${i}" ${sudahDiisi ? 'disabled' : ''}>
            </div>
            <div class="mb-2">
              <label>Bukti Dukung</label>
              <input type="file" class="form-control bukti-input" id="bukti-${i}" ${sudahDiisi ? 'disabled' : ''}>
            </div>
            <button class="btn btn-${sudahDiisi ? 'success' : 'primary'} w-100 btnSubmitSesi" data-sesi="${i}" ${sudahDiisi ? 'disabled' : ''}>
              ${sudahDiisi ? 'Terkirim' : 'Kirim'}
            </button>
          </div>
        `;
        container.appendChild(card);
      }

      document.querySelectorAll('.btnSubmitSesi').forEach(btn => {
        btn.addEventListener('click', async e => {
          const sesi = btn.dataset.sesi;
          const kegiatan = document.getElementById(`kegiatan-${sesi}`).value;
          const bukti = document.getElementById(`bukti-${sesi}`).files[0];

          if (!kegiatan || !bukti) {
            return Swal.fire('Error', 'Kegiatan dan bukti wajib diisi.', 'error');
          }

          Swal.fire({ title: 'Menyimpan...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

          const formData = new FormData();
          formData.append('action', 'submitForm');
          formData.append('nama', pegawaiAktif.nama);
          formData.append('sesi', sesi);
          formData.append('kegiatan', kegiatan);
          formData.append('file', bukti);

          try {
            const res = await fetch(BASE_URL, { method: 'POST', body: formData });
            const result = await res.json();
            if (result.success) {
              Swal.fire('Berhasil', 'Laporan sesi berhasil disimpan!', 'success');
              tampilkanFormSesi();
            } else {
              Swal.fire('Gagal', result.message || 'Gagal menyimpan data.', 'error');
            }
          } catch (err) {
            Swal.fire('Error', 'Terjadi kesalahan jaringan.', 'error');
          }
        });
      });
    });
}
