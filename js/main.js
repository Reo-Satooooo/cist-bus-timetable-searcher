let cistBusTimeTableJson = "";
let cistBusTimeTable = [];
let inbound = [];
let outbound = [];
let nextDepartureOutbound;
let nextDepartureInbound;
const now = new Date();
const currentTime = now.toTimeString().slice(0, 5);

window.addEventListener('load', async function () {
  try {
    updateCurrentTime();
    const json = await loadCistBusJson();
    cistBusTimeTableJson = JSON.parse(json);
    inbound = cistBusTimeTableJson.sheet.timetable.inbound;
    outbound = cistBusTimeTableJson.sheet.timetable.outbound;

    // ロード画面を表示
    document.getElementById("loading").style.display = "block";

    // highlightNextDeparture関数の処理を完了するまで待つ
    await highlightNextDeparture("time-row-outbound", currentTime);

    // 往路のテーブルを表示
    outboundTableCreate();
    setActiveButton("outbound-button");

    // ロード画面を非表示
    document.getElementById("loading").style.display = "none";

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

function updateCurrentTime() {
  const currentTimeElement = document.getElementById("current-time");
  const now = new Date();
  const options = { year: "numeric", month: "long", day: "numeric", weekday: "long", hour: "2-digit", minute: "2-digit" };
  const formattedDate = now.toLocaleString("ja-JP", options);
  currentTimeElement.textContent = "現在の時刻：" + formattedDate;
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
      break;
    }
  }
}

async function loadCistBusJson() {
  try {
    const response = await fetch("http://0.0.0.0:8080/json");
    if (!response.ok) {
      throw new Error("Failed to load JSON");
    }
    const data = await response.json();
    return JSON.stringify(data, null, 2);
  } catch (error) {
    throw error;
  }
}
