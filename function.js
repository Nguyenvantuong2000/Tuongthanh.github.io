function setStation(id) {
  localStorage.setItem("selectedStation", id);
}

function openChart() {
  const id = localStorage.getItem("selectedStation");

  if (id == 1) {
    window.location.href = "chart1.html";
  } else if (id == 2) {
    window.location.href = "chart2.html";
  } else {
    alert("Vui lòng chọn trạm trước!");
  }
}
// ==== Hiển thị thời gian ==== ///
function dongho() {
  const time = new Date();
  const gio = time.getHours().toString().padStart(2, "0");
  const phut = time.getMinutes().toString().padStart(2, "0");
  const giay = time.getSeconds().toString().padStart(2, "0");
  const ngay = time.getDate().toString().padStart(2, "0");
  const thang = (time.getMonth() + 1).toString().padStart(2, "0");
  const nam = time.getFullYear();

  const thu = [
    "Chủ Nhật",
    "Thứ Hai",
    "Thứ Ba",
    "Thứ Tư",
    "Thứ Năm",
    "Thứ Sáu",
    "Thứ Bảy",
  ];

  document.getElementById(
    "time"
  ).innerText = `${gio}:${phut}:${giay} - ${ngay}/${thang}/${nam}`;
  document.getElementById("day").innerText = thu[time.getDay()];

  setTimeout(dongho, 1000);
}

// Mở Google Sheet
function moGoogleSheet() {
  window.open(
    "https://docs.google.com/spreadsheets/d/1bryelQ4k5IsGoUXwtln8TIVee8fBm55VLKs8xH2xK00/edit?usp=sharing",
    "_blank"
  );
}

function formatLastUpdate(raw) {
  if (!raw) return "--";

  // raw: 04-08-59_14-12-2025
  const [timePart, datePart] = raw.split("_");

  const [hh, mm, ss] = timePart.split("-");
  const [dd, MM, yyyy] = datePart.split("-");

  return `${hh}:${mm}:${ss} • ${dd}/${MM}/${yyyy}`;
}

// Hàm đọc dữ liệu Firebase
function docDuLieu(tram) {
  if (dbRef) dbRef.off();

  dbRef = firebase.database().ref(tram);
  dbRef.on("value", (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    document.getElementById("nhietdo").innerText = data.temp + " °C";
    document.getElementById("doam").innerText = data.hum + " %";
    document.getElementById("luongmua").innerText = data.rain + " mm";
    document.getElementById("tocdogio").innerText = data.wind + " m/s";
    document.getElementById("co").innerText = data.co + " ppm";
    document.getElementById("uv").innerText = data.uv;
    document.getElementById("bui").innerText = data.dust + " µg/m³";
    document.getElementById("doon").innerText = data.noise + " dB";
    document.getElementById("dienap").innerText = data.bat + " V";
    document.getElementById("last_update_alert").innerText = formatLastUpdate(
      data.last_update
    );
    document.getElementById("last_update").innerText = formatLastUpdate(
      data.last_update
    );
    const Image = document.getElementById("status");
    Image.src =
      data.connected === true || data.connected === "true"
        ? "image/status_true.png"
        : "image/status_false.png";
  });
}

function chonTram(tram) {
  if (tram === "slave1") {
    btnTram1.style.backgroundColor = "#2b7cff";
    btnTram1.style.color = "white";
    btnTram2.style.backgroundColor = "#ccc";
    btnTram2.style.color = "black";
  } else {
    btnTram2.style.backgroundColor = "#2b7cff";
    btnTram2.style.color = "white";
    btnTram1.style.backgroundColor = "#ccc";
    btnTram1.style.color = "black";
  }
  docDuLieu(tram);
}
//ÀM CHUYỂN last_update → Date object//
function parseLastUpdate(str) {
  // "17-49-30_12-12-2025"
  const [timePart, datePart] = str.split("_");
  const [hh, mm, ss] = timePart.split("-").map(Number);
  const [dd, MM, yyyy] = datePart.split("-").map(Number);

  return new Date(yyyy, MM - 1, dd, hh, mm, ss);
}
//HÀM KIỂM TRA KẾT NỐI MASSTER & GHI VÀO FIREBASE//
function checkConnection(slaveName) {
  const slaveRef = firebase.database().ref(slaveName);
  const masterRef = firebase.database().ref("master");

  slaveRef.once("value").then((snapshot) => {
    const data = snapshot.val();
    if (!data || !data.last_update) return;

    const lastUpdateTime = parseLastUpdate(data.last_update);
    const now = new Date();

    const diffMs = now - lastUpdateTime;
    const diffMinutes = diffMs / 60000; // đổi ra phút

    console.log(slaveName, "chênh phút:", diffMinutes.toFixed(2));

    if (diffMinutes > 2) {
      masterRef.set("lost_connect");
    } else if (diffMinutes < 1) {
      masterRef.set("connect");
    }
  });
}
