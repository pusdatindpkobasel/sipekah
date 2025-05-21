const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxS9glVdvcS0yfMOeEdYxiTgjLbwc2F_TRwoxGG1dYh_3cAPqzFWnHUOOiLSdFgMZR3rA/exec';

let pegawaiList = [];

// JSONP callback untuk load data pegawai
function handlePegawai(data) {
  pegawaiList = data;
  const select = document.getElementById('nama');
  data.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p[0];
    opt.textContent = p[0];
    select.appendChild(opt);
  });
}

// Load data pegawai via JSONP
(function loadPegawai(){
  const script = document.createElement('script');
  script.src = `${WEB_APP_URL}?action=getPegawai&callback=handlePegawai`;
  script.onerror = () => Swal.fire('Error', 'Gagal memuat data pegawai', 'error');
  document.body.appendChild(script);
})();

// Login form submit handler
document.getElementById('login-form').addEventListener('submit', e => {
  e.preventDefault();
  const nama = document.getElementById('nama').value;
  const pin = document.getElementById('pin').value;
  const data = pegawaiList.find(p => p[0] === nama);

  if (!data || pin !== data[7]) {
    Swal.fire('Gagal', 'PIN salah', 'error');
    return;
  }

  Swal.fire({
    title: 'Memuat data...',
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  const userData = {
    nama: data[0],
    nip: data[2],
    subbid: data[3],
    status: data[4],
    golongan: data[5],
    jabatan: data[6]
  };

  localStorage.setItem('userData', JSON.stringify(userData));
  localStorage.setItem('loginTime', new Date().toISOString());

  setTimeout(() => {
    Swal.close();
    window.location.href = 'index.html';
  }, 1000); // simulasi loading
});
