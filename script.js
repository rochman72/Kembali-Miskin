// Konfigurasi TradingView
let tvWidget = new TradingView.widget({
    "autosize": true,
    "symbol": "OANDA:XAUUSD",
    "interval": "15",
    "container_id": "tv-chart",
    "theme": "dark",
    "locale": "id"
});

const TF_LIST = ["1","3","5","15","30","60","240","D","W","M"];
let currentTF = "15";

// Menunggu DOM siap agar tidak error 'null'
document.addEventListener("DOMContentLoaded", () => {
    let tfBtnContainer = document.getElementById("tfButtons");
    
    if (tfBtnContainer) {
        TF_LIST.forEach(tf => {
            let b = document.createElement("button");
            b.innerText = tf;
            b.onclick = () => {
                currentTF = tf;
                tvWidget.setSymbol("OANDA:XAUUSD", tf);
                runAll();
            };
            tfBtnContainer.appendChild(b);
        });
    }
    // Jalankan analisa awal setelah 2 detik (nunggu widget load)
    setTimeout(runAll, 2000);
});

async function loadData() {
    try {
        let url = `https://api.tv.fwit.xyz/ohlc?symbol=OANDA:XAUUSD&tf=${currentTF}`;
        let res = await fetch(url);
        return await res.json();
    } catch (e) {
        console.error("Gagal ambil data API", e);
        return [];
    }
}

async function runAll() {
    let raw = await loadData();
    if (!raw || raw.length === 0) return;

    let candles = raw.map(d => ({
        time: d[0], open: d[1], high: d[2], low: d[3], close: d[4]
    }));

    // Menggunakan logika dari SMC Engine
    let swings = SMC.detectStructure(candles);
    let bos = SMC.detectBOS(swings);
    let fvg = SMC.detectFVG(candles);
    let ob = SMC.detectOrderBlock(candles);

    let price = candles[candles.length - 1].close;
    let high = candles[candles.length - 1].high;
    let low = candles[candles.length - 1].low;

    let ote = SMC.detectOTE(high, low);
    let bias = SMC.detectBias(bos, fvg, ob);
    let signal = SMC.detectSignal(price, ote, bias);

    // Update UI Badge
    let badge = document.getElementById("signalBadge");
    if (badge) {
        badge.innerText = "SIGNAL: " + signal;
        // Menyesuaikan dengan class di CSS kamu: .buy, .sell, .waiting
        badge.className = "badge " + (signal === "BUY" ? "buy" : (signal === "SELL" ? "sell" : "waiting"));
    }

    // Update Output
    let out = document.getElementById("output");
    if (out) {
        out.innerHTML = `
            <b>Market Structure:</b> ${bos}
            <b>Current Bias:</b> ${bias}
            
            <b>OTE Buy Zone:</b> ${ote.buy.zone[0].toFixed(2)} - ${ote.buy.zone[1].toFixed(2)}
            <b>OTE Sell Zone:</b> ${ote.sell.zone[0].toFixed(2)} - ${ote.sell.zone[1].toFixed(2)}
            
            <b>Order Block:</b> ${ob ? ob.type + " (Found)" : "Not Detected"}
        `;
    }
}

function calculateSMC() { runAll(); }
