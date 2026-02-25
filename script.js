// =========================================
// OMOON SMC ENGINE — MAIN UI SCRIPT
// =========================================

// -----------------------------------------
// TRADINGVIEW WIDGET
// -----------------------------------------
let tvWidget = new TradingView.widget({
    autosize: true,
    symbol: "OANDA:XAUUSD",
    interval: "15",
    container_id: "tv-chart",
    theme: "dark",
    locale: "id"
});

// List timeframes
const TF_LIST = ["1","3","5","15","30","60","240","D","W","M"];
let currentTF = "15";

let tfBtn = document.getElementById("tfButtons");

// Render TF buttons
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

// -----------------------------------------
// FETCH OHLC DATA (API FAST)
// -----------------------------------------
async function loadData() {
    let url = `https://api.tv.fwit.xyz/ohlc?symbol=OANDA:XAUUSD&tf=${currentTF}`;
    let res = await fetch(url);
    return await res.json();
}

// -----------------------------------------
// MAIN ENGINE RUNNER
// -----------------------------------------
async function runAll() {

    let raw = await loadData();

    // candle mapping
    let candles = raw.map(d => ({
        time: d[0],
        open: d[1],
        high: d[2],
        low: d[3],
        close: d[4]
    }));

    // FEED TO ENGINE
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

    // Auto RR calculator: SL berdasarkan OTE
    let entry = price;
    let sl = signal === "BUY" ? lastLow : lastHigh;
    let rr = SMC.rrCalc(entry, sl);

    // -----------------------------------------
    // UPDATE BADGE
    // -----------------------------------------
    let badge = document.getElementById("signalBadge");

    if (signal === "BUY") {
        badge.innerText = "BUY SIGNAL";
        badge.className = "badge buy";
    } 
    else if (signal === "SELL") {
        badge.innerText = "SELL SIGNAL";
        badge.className = "badge sell";
    } 
    else {
        badge.innerText = "WAITING";
        badge.className = "badge";
    }

    // -----------------------------------------
    // BUILD OUTPUT HTML
    // -----------------------------------------
    document.getElementById("output").innerHTML = `
        <h3>Market Structure</h3>
        BOS / CHoCH: <b>${bos}</b><br>
        Bias: <b>${bias}</b><br><br>

        <h3>OTE Zones</h3>
        BUY ZONE: ${ote.buy.zone[0].toFixed(2)} — ${ote.buy.zone[1].toFixed(2)}<br>
        SELL ZONE: ${ote.sell.zone[0].toFixed(2)} — ${ote.sell.zone[1].toFixed(2)}<br><br>

        <h3>Equal Levels</h3>
        EQH: ${JSON.stringify(eq.eqh)}<br>
        EQL: ${JSON.stringify(eq.eql)}<br><br>

        <h3>Order Block</h3>
        ${
            ob
            ? `${ob.type} OB ( ${ob.bottom.toFixed(2)} - ${ob.top.toFixed(2)} )`
            : "Tidak ada"
        }
        <br><br>

        <h3>Fair Value Gap</h3>
        ${
            fvg.map(f => `${f.type} → ${f.gap[0].toFixed(2)} - ${f.gap[1].toFixed(2)}`).join("<br>")
        }
        <br><br>

        <h3>Auto-RR</h3>
        Entry: <b>${entry.toFixed(2)}</b><br>
        Stop Loss: <b>${sl.toFixed(2)}</b><br><br>
        TP1 (RR 1:1): ${rr.tp1.toFixed(2)}<br>
        TP2 (RR 1:2): ${rr.tp2.toFixed(2)}<br>
        TP3 (RR 1:3): ${rr.tp3.toFixed(2)}<br><br>

        <h3>Final Signal</h3>
        <b>${signal}</b>
    `;
}
