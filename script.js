<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>Dummy Fetch JSON Dropdown</title>
</head>
<body>
  <select id="nama"></select>

  <script>
    // Dummy endpoint JSON (gunakan endpoint server kamu nanti)
    const DUMMY_JSON_URL = "https://api.npoint.io/93bed93a99df4c91044e";

    function loadJSON() {
      fetch(DUMMY_JSON_URL)
        .then(res => res.json())
        .then(data => {
          console.log("Data diterima via fetch JSON:", data);
          const namaSelect = document.getElementById("nama");
          namaSelect.innerHTML = '<option value="">Pilih Nama</option>';
          data.forEach(p => {
            const opt = document.createElement("option");
            opt.value = p[0];
            opt.textContent = p[0];
            namaSelect.appendChild(opt);
          });
        })
        .catch(err => console.error("Gagal fetch data:", err));
    }

    window.onload = () => {
      loadJSON();
    }
  </script>
</body>
</html>
