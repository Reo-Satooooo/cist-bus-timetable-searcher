let cistBusTimeTableJson = "";
let inbound = [];
let outbound = [];
let nextDepartureOutbound;
let nextDepartureInbound;
const now = new Date();
// テスト時: 実際の現在時刻に任意の分を足して使用
const addTime = 0;
now.setMinutes(now.getMinutes() + addTime);

let firstLoadDate = now.getDate();
console.log(firstLoadDate);
let currentTime = now.toTimeString().slice(0, 5);


window.addEventListener('load', async function () {
  try {    
      updateCurrentTime();
      const json = await loadCistBusJson();
      cistBusTimeTableJson = JSON.parse(json);
      inbound = cistBusTimeTableJson.sheet.timetable.inbound;
      outbound = cistBusTimeTableJson.sheet.timetable.outbound;

      // デフォルトで復路のテーブルを表示
      document.getElementById("outbound-timetable").style.display = "none";
      document.getElementById("inbound-timetable").style.display = "block";
      outboundTableCreate();
      inboundTableCreate();
      setActiveButton("inbound-button");

      // highlightNextDeparture関数の処理を完了するまで待つ
      currentTime = getCurrentTimeString();
      highlightNextDeparture("time-row-inbound", currentTime);

      // ロード画面をフェードアウト
      fadeOutLoadingScreen();

      // 1秒ごとに現在時刻を更新し、次のバスの出発時刻をハイライトする
      // 毎秒の更新が不要の場合は、コメントアウトする
      setInterval(() => {
          const reloadedCurrent = getCurrentTimeString();
          let currentDate = updateCurrentTime();
          if (firstLoadDate !== currentDate.getDate()) {
            window.location.reload();
            firstLoadDate = now.getDate();
            console.log(firstLoadDate)
          }
          highlightNextDeparture("time-row-outbound", reloadedCurrent);
          highlightNextDeparture("time-row-inbound", reloadedCurrent);
      }, 1 * 1000);

  } catch (error) {
      console.error(error);
  }
});

document.getElementById("outbound-button").addEventListener("click", () => {
  document.getElementById("outbound-timetable").style.display = "block";
  document.getElementById("inbound-timetable").style.display = "none";
  outboundTableCreate();
  setActiveButton("outbound-button");
  highlightNextDeparture("time-row-outbound", currentTime);
});

document.getElementById("inbound-button").addEventListener("click", () => {
  document.getElementById("outbound-timetable").style.display = "none";
  document.getElementById("inbound-timetable").style.display = "block";
  inboundTableCreate();
  setActiveButton("inbound-button");
  highlightNextDeparture("time-row-inbound", currentTime);
});

// ハイライトを追従させるかどうかを切り替える
document.getElementById("switch-highlight").addEventListener("change", () => {
  const followCheckbox = document.getElementById("switch-highlight");
  if (followCheckbox.checked){
      const reloadedCurrent = getCurrentTimeString();
      highlightNextDeparture("time-row-outbound", reloadedCurrent);
      highlightNextDeparture("time-row-inbound", reloadedCurrent);
  }
});

// 現在時刻の表示を更新する
function updateCurrentTime() {
  const currentTimeElement = document.getElementById("current-time");
  const now = new Date();
  // テスト時: 実際の現在時刻に任意の分を足して使用
  now.setMinutes(now.getMinutes() + addTime);

  const options = { year: "numeric", month: "long", day: "numeric", weekday: "long", hour: "2-digit", minute: "2-digit" };
  const formattedDate = now.toLocaleString("ja-JP", options);
  currentTimeElement.textContent = "現在の時刻：" + formattedDate;
  return now;
}

function getCurrentTimeString() {
  const now = new Date();
  // テスト時: 実際の現在時刻に任意の分を足して使用
  now.setMinutes(now.getMinutes() + addTime);

  console.log(now.toTimeString().slice(0, 5));
  return now.toTimeString().slice(0, 5);
}

function setActiveButton(buttonId) {
  const buttons = document.querySelectorAll(".timetable-search-area button");
  buttons.forEach(button => {
    button.classList.remove("active");
  });
  document.getElementById(buttonId).classList.add("active");
}

function clearTable(tableDiv) {
  while (tableDiv.firstChild) {
    tableDiv.removeChild(tableDiv.firstChild);
  }
}

function createTableHeaderRow(parentElement, rowData) {
  const tr = document.createElement("tr");
  for (const value of rowData) {
    const th = document.createElement("th");
    th.textContent = value;
    tr.appendChild(th);
  }
  parentElement.appendChild(tr);
}

function createTableRow(parentElement, rowData) {
  const tr = document.createElement("tr");
  for (const value of rowData) {
    const td = document.createElement("td");
    td.textContent = value;
    tr.appendChild(td);
  }
  parentElement.appendChild(tr);
}

function outboundTableCreate() {
  const tableDiv = document.getElementById("time-row-outbound");
  clearTable(tableDiv);
  const headerRowData = ["千歳駅発", "南千歳駅発", "研究実験棟発", "本部棟着"];
  createTableHeaderRow(tableDiv, headerRowData);

  for (const entry of outbound) {
    const rowData = [entry.chitose, entry.minami_chitose, entry.lab, entry.main];
    createTableRow(tableDiv, rowData);
  }
}

function inboundTableCreate() {
  const tableDiv = document.getElementById("time-row-inbound");
  clearTable(tableDiv);
  const headerRowData = ["本部棟発", "研究実験棟発", "南千歳駅発", "千歳駅着"];
  createTableHeaderRow(tableDiv, headerRowData);

  for (const entry of inbound) {
    const rowData = [entry.main, entry.lab, entry.minami_chitose, entry.chitose];
    createTableRow(tableDiv, rowData);
  }
}

function getTimeInMinutes(time) {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

async function highlightNextDeparture(tableId, currentTime) {
  const table = document.getElementById(tableId);
  const rows = table.querySelectorAll("tr");
  const currentMinutes = getTimeInMinutes(currentTime);

  for (const row of rows) {
    const cells = row.querySelectorAll("td");
    let departureTime = null;

    for (const cell of cells) {
      const time = cell.textContent;
      if (time === "-") {
        continue;
      }
      const timeMinutes = getTimeInMinutes(time);
      if (timeMinutes > currentMinutes) {
        departureTime = time;
        break;
      }
      else {
        break;
      }
    }

    if (departureTime) {
      row.classList.add("highlight");
      const followCheckbox = document.getElementById("switch-highlight");
      if (followCheckbox.checked) {
        // addした要素が画面内に表示されるようにスクロールする
        row.scrollIntoView({ behavior: "smooth", block: "center" ,inline: "center"});
      }
      break;
    }
    else {
      row.classList.remove("highlight");
    }
  }
}

function fadeOutLoadingScreen() {
  const loadingElement = document.getElementById("loading");
  loadingElement.style.transition = "opacity 1s ease";
  loadingElement.style.opacity = 0;

  loadingElement.addEventListener("transitionend", () => {
    loadingElement.style.display = "none";
  });
}

async function loadCistBusJson() {
  try {
    const response = await fetch("https://cist-bus-api.com/json");
    if (!response.ok) {
      throw new Error("Failed to load JSON");
    }
    const data = await response.json();
    return JSON.stringify(data, null, 2);
  } catch (error) {
    throw error;
  }
}
