let tvWidget = new TradingView.widget({
    autosize: true,
    symbol: "OANDA:XAUUSD",
    interval: "15",
    container_id: "tv-chart",
    theme: "dark",
    locale: "id"
});

const TF_LIST = ["1","3","5","15","30","60","240","D","W","M"];
let currentTF = "15";

// Menunggu HTML selesai dimuat agar tidak error 'null'
document.addEventListener("DOMContentLoaded", () => {
    let tfBtn = document.getElementById("tfButtons");
    if (tfBtn) {
        TF_LIST.forEach(tf => {
            let b = document.createElement("button");
            b.innerText = tf;
            b.onclick = () => {
                currentTF = tf;
                tvWidget.setSymbol("OANDA:XAUUSD", tf);
                runAll();
            };
            tfBtn.appendChild(b);
        });
    }
});

async function loadData() {
    try {
        let url = `https://api.tv.fwit.xyz/ohlc?symbol=OANDA:XAUUSD&tf=${currentTF}`;
        let res = await fetch(url);
        return await res.json();
    } catch (e) {
        console.error("Gagal load data API", e);
        return [];
    }
}

async function runAll() {
    let raw = await loadData();
    if (!raw || raw.length === 0) return;

    let candles = raw.map(d => ({
        time: d[0], open: d[1], high: d[2], low: d[3], close: d[4]
    }));

    // Logika SMC Engine tetap dipertahankan
    let swings = SMC.detectStructure(candles);
    let bos = SMC.detectBOS(swings);
    let fvg = SMC.detectFVG(candles);
    let eq = SMC.detectEqualLevels(swings);
    let ob = SMC.detectOrderBlock(candles);

    let lastHigh = candles[candles.length - 1].high;
    let lastLow = candles[candles.length - 1].low;
    let price = candles[candles.length - 1].close;

    let ote = SMC.detectOTE(lastHigh, lastLow);
    let bias = SMC.detectBias(bos, fvg, ob);
    let signal = SMC.detectSignal(price, ote, bias);
    let rr = SMC.rrCalc(price, (signal === "BUY" ? lastLow : lastHigh));

    // Update UI
    let badge = document.getElementById("signalBadge");
    if (badge) {
        badge.innerText = signal === "BUY" ? "BUY SIGNAL" : (signal === "SELL" ? "SELL SIGNAL" : "WAITING");
        badge.className = "badge " + signal.toLowerCase();
    }

    let outElem = document.getElementById("output");
    if (outElem) {
        outElem.innerHTML = `
            <h3>Structure: ${bos} | Bias: ${bias}</h3>
            <p>OTE Buy: ${ote.buy.zone[0].toFixed(2)} - ${ote.buy.zone[1].toFixed(2)}</p>
            <p>OTE Sell: ${ote.sell.zone[0].toFixed(2)} - ${ote.sell.zone[1].toFixed(2)}</p>
            <p>OB: ${ob ? ob.type : 'None'}</p>
        `;
    }
}

// Untuk tombol manual
function calculateSMC() {
    runAll();
}
