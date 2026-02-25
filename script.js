// ============================================
// MAIN APP SCRIPT — CONNECT UI + SMC ENGINE
// ============================================

let tvWidget = new TradingView.widget({
    autosize: true,
    symbol: "OANDA:XAUUSD",
    interval: "15",
    container_id: "tv-chart",
    theme: "dark",
    locale: "id"
});

// Timeframes
const TF_LIST = ["1","3","5","15","30","60","240","D","W","M"];
let currentTF = "15";

let tfBtn = document.getElementById("tfButtons");
TF_LIST.forEach(tf=>{
    let b = document.createElement("button");
    b.innerText = tf;
    b.onclick = ()=>{ currentTF = tf; tvWidget.setSymbol("OANDA:XAUUSD", tf); };
    tfBtn.appendChild(b);
});

// Fetch candle data
async function loadData(){
    let url = `https://api.tv.fwit.xyz/ohlc?symbol=OANDA:XAUUSD&tf=${currentTF}`;
    let res = await fetch(url);
    return await res.json();
}

// RUN ALL ENGINE
async function runAll() {
    let data = await loadData();

    let candles = data.map(d=>({
        time:d[0], open:d[1], high:d[2], low:d[3], close:d[4]
    }));

    let swings = SMC.detectStructure(candles);
    let bos = SMC.detectBOS(swings);
    let fvg = SMC.detectFVG(candles);
    let eq = SMC.detectEqualLevels(swings);

    let hi = candles[candles.length-1].high;
    let lo = candles[candles.length-1].low;
    let ote = SMC.detectOTE(hi, lo);

    // badge
    let price = candles[candles.length-1].close;
    let badge = document.getElementById("signalBadge");

    if(price >= ote.buy.zone[0] && price <= ote.buy.zone[1]){
        badge.innerText="BUY AREA";
        badge.className="badge buy";
    }
    else if(price >= ote.sell.zone[0] && price <= ote.sell.zone[1]){
        badge.innerText="SELL AREA";
        badge.className="badge sell";
    }
    else {
        badge.innerText="WAITING";
        badge.className="badge";
    }

    // output
    document.getElementById("output").innerHTML = `
        <h3>Market Structure</h3>
        BOS: <b>${bos}</b><br><br>

        <h3>OTE Zones</h3>
        BUY: ${ote.buy.zone[0].toFixed(2)} — ${ote.buy.zone[1].toFixed(2)}<br>
        SELL: ${ote.sell.zone[0].toFixed(2)} — ${ote.sell.zone[1].toFixed(2)}<br><br>

        <h3>Equal High / Low</h3>
        EQH: ${JSON.stringify(eq.eqh)}<br>
        EQL: ${JSON.stringify(eq.eql)}<br><br>

        <h3>FVG</h3>
        ${fvg.map(f=>`${f.type} → ${f.gap[0].toFixed(2)} - ${f.gap[1].toFixed(2)}`).join("<br>")}
    `;
}
