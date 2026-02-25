// ===============================
// OMOON SMC ENGINE — CORE LOGIC
// ===============================

const SMC = {

    detectStructure(candles) {
        let swings = [];
        for (let i = 2; i < candles.length - 2; i++) {
            let c = candles;

            // swing high
            if (c[i].high > c[i-1].high && c[i].high > c[i-2].high &&
                c[i].high > c[i+1].high && c[i].high > c[i+2].high) {
                    swings.push({type:"SH", price:c[i].high, index:i});
            }

            // swing low
            if (c[i].low < c[i-1].low && c[i].low < c[i-2].low &&
                c[i].low < c[i+1].low && c[i].low < c[i+2].low) {
                    swings.push({type:"SL", price:c[i].low, index:i});
            }
        }
        return swings;
    },

    detectBOS(swings) {
        if (swings.length < 3) return "No BOS";

        let last = swings[swings.length-1];
        let prev = swings[swings.length-2];

        if (last.type === "SH" && last.price > prev.price) return "BOS UP";
        if (last.type === "SL" && last.price < prev.price) return "BOS DOWN";

        return "Ranging";
    },

    detectFVG(candles) {
        let fvg = [];

        for (let i = 2; i < candles.length; i++) {
            let c0 = candles[i];
            let c1 = candles[i-1];
            let c2 = candles[i-2];

            // bullish FVG
            if (c2.low > c0.high) {
                fvg.push({type:"BULL", gap:[c0.high, c2.low], index:i});
            }

            // bearish FVG
            if (c2.high < c0.low) {
                fvg.push({type:"BEAR", gap:[c2.high, c0.low], index:i});
            }
        }

        return fvg;
    },

    detectEqualLevels(swings, tolerance=0.0005) {
        let eqh = [];
        let eql = [];

        for (let i=1; i<swings.length; i++){
            let s1 = swings[i];
            let s2 = swings[i-1];

            if (s1.type==="SH" && s2.type==="SH") {
                if (Math.abs(s1.price - s2.price) <= tolerance) eqh.push([s1.price, s2.price]);
            }
            if (s1.type==="SL" && s2.type==="SL") {
                if (Math.abs(s1.price - s2.price) <= tolerance) eql.push([s1.price, s2.price]);
            }
        }

        return {eqh,eql};
    },

    detectOTE(high, low) {
        let range = high - low;

        return {
            buy: {
                zone: [ low + range*0.618, low + range*0.79 ]
            },
            sell: {
                zone: [ high - range*0.79, high - range*0.618 ]
            }
        };
    }
};
