import { SJIS } from "https://code4sabae.github.io/js/SJIS.js";

const CSV = {};

CSV.parse = (s) => CSV.toJSON(CSV.decode(s));
CSV.stringify = (json) => CSV.encode(CSV.fromJSON(json));

CSV.addBOM = function (s) {
  if (s != null) {
    return "\ufeff" + s;
  }
  return s;
};
CSV.removeBOM = function (s) {
  if (s && typeof s == "string" && s.length > 0 && s.charAt(0) === "\ufeff") {
    return s.substring(1);
  }
  return s;
};
CSV.decode = function (s) {
  s = CSV.removeBOM(s);
  const res = [];
  let st = 0;
  let line = [];
  let sb = null;
  if (!s.endsWith("\n")) s += "\n";
  const len = s.length;
  for (let i = 0; i < len; i++) {
    const c = s.charAt(i);
    if (c === "\r") continue;
    if (st === 0) {
      if (c === "\n") {
        if (line.length > 0) line.push("");
        res.push(line);
        line = [];
      } else if (c == ",") {
        line.push("");
      } else if (c == '"') {
        sb = "";
        st = 2;
      } else {
        sb = c;
        st = 1;
      }
    } else if (st === 1) {
      if (c === "\n") {
        line.push(sb);
        res.push(line);
        line = [];
        st = 0;
        sb = null;
      } else if (c === ",") {
        line.push(sb);
        sb = null;
        st = 0;
      } else {
        sb += c;
      }
    } else if (st === 2) {
      if (c === '"') {
        st = 3;
      } else {
        sb += c;
      }
    } else if (st === 3) {
      if (c === '"') {
        sb += c;
        st = 2;
      } else if (c === ",") {
        line.push(sb);
        sb = null;
        st = 0;
      } else if (c === "\n") {
        line.push(sb);
        res.push(line);
        line = [];
        st = 0;
        sb = null;
      }
    }
  }
  if (sb != null) line.push(sb);
  if (line.length > 0) res.push(line);
  return res;
};
CSV.encode = function (csvar) {
  let s = [];
  for (let i = 0; i < csvar.length; i++) {
    let s2 = [];
    const line = csvar[i];
    for (let j = 0; j < line.length; j++) {
      const v = line[j];
      if (v == undefined || v.length == 0) {
        s2.push("");
      } else if (typeof v == "number") {
        s2.push(v);
      } else if (typeof v != "string") {
        s2.push('"' + v + '"');
      } else if (v.indexOf('"') >= 0) {
        s2.push('"' + v.replace(/\"/g, '""') + '"');
      } else if (v.indexOf(",") >= 0 || v.indexOf("\n") >= 0) {
        s2.push('"' + v + '"');
      } else {
        s2.push(v);
      }
    }
    s.push(s2.join(","));
  }
  return CSV.addBOM(s.join("\r\n") + "\r\n");
};
CSV.toJSON = function (csv, removeblacket) {
  const res = [];
  const head = csv[0];
  if (removeblacket) {
    for (let i = 0; i < head.length; i++) {
      const h = head[i];
      const n = h.indexOf("(");
      const m = h.indexOf("（");
      let l = -1;
      if (n === -1) {
        l = m;
      } else if (m === -1) {
        l = n;
      } else {
        l = Math.min(n, m);
      }
      head[i] = (l > 0 ? h.substring(0, l) : h).trim();
    }
  }
  for (let i = 1; i < csv.length; i++) {
    const d = {};
    for (let j = 0; j < head.length; j++) {
      d[head[j]] = csv[i][j];
    }
    res.push(d);
  }
  return res;
};
CSV.fromJSON = function (json) {
  if (!Array.isArray(json)) {
    throw "is not array!";
  }
  const head = [];
  for (const d of json) {
    for (const name in d) {
      if (head.indexOf(name) == -1) {
        head.push(name);
      }
    }
  }
  const res = [head];
  for (const d of json) {
    const line = [];
    for (let i = 0; i < head.length; i++) {
      const v = d[head[i]];
      if (v == undefined) {
        line.push("");
      } else {
        line.push(v);
      }
    }
    res.push(line);
  }
  return res;
};
CSV.toMarkdown = function (csvorjson) {
  const csv = Array.isArray(csvorjson[0]) ? csvorjson : CSV.fromJSON(csvorjson);
  const res = [];
  const head = csv[0];
  res.push("# " + head[0]);
  res.push("");
  for (let i = 1; i < csv.length; i++) {
    const d = csv[i];
    res.push("## " + d[0]);
    res.push("");
    for (let j = 1; j < head.length; j++) {
      if (d[j] != null) {
        if (typeof d[j] == "string" && d[j].indexOf("\n") >= 0) {
          res.push("### " + head[j]);
          res.push("");
          const ss = d[j].split("\n");
          for (const s of ss) {
            if (s.length > 0 && "\\-#".indexOf(s[0]) >= 0) {
              res.push("\\" + s);
              res.push("");
            } else {
              res.push(s);
              res.push("");
            }
          }
        } else {
          if (res[res.length - 1] == "" && res[res.length - 2][0] == "-") {
            res.pop();
          }
          res.push("- " + head[j] + ": " + d[j]);
          res.push("");
        }
      }
    }
  }
  return res.join("\n");
};
CSV.fromMarkdown = function (s) {
  const ss = s.split("\n");
  if (!ss[0].startsWith("# ")) {
    throw new Error("not supported format");
  }
  const idname = ss[0].substring(2);
  const res = [];
  let n = 1;
  while (n < ss.length) {
    if (!ss[n].startsWith("## ")) {
      n++;
      continue;
    }
    const id = ss[n++].substring(3);
    const d = {};
    d[idname] = id;
    while (n < ss.length) {
      if (ss[n].startsWith("- ")) {
        const ssn = ss[n++];
        const m = ssn.indexOf(": ");
        if (m < 0) {
          throw new Error("not supported format");
        }
        const name = ssn.substring(2, m);
        const val = ssn.substring(m + 2);
        d[name] = val;
      } else if (ss[n].startsWith("### ")) {
        const name = ss[n].substring(4);
        n += 2;
        const val = [];
        for (;;) {
          const s1 = ss[n++];
          if (s1[0] == "-" || s1[0] == "#" || n == ss.length) {
            break;
          }
          if (s1[0] == "\\") {
            val.push(s1.substring(1));
          } else {
            val.push(s1);
          }
          if (n < ss.length && ss[n] == "") {
            n++;
            if (n == ss.length) {
              break;
            }
          }
        }
        d[name] = val.join("\n");
        n--;
      } else if (ss[n].startsWith("## ")) {
        break;
      } else {
        n++;
      }
    }
    res.push(d);
  }
  return res;
};
CSV.fetchOrLoad = async (fn) => {
  if (fn.startsWith("https://") || fn.startsWith("http://") || !globalThis.Deno) {
    return new Uint8Array(await (await fetch(fn)).arrayBuffer());
  } else {
    return await Deno.readFile(fn);
  }
}
CSV.fetchUtf8 = async (url) => {
  const data = await (await fetch(url)).text();
  const csv = CSV.decode(data);
  return csv;
};
CSV.fetch = async (url) => {
  const data = SJIS.decodeAuto(await CSV.fetchOrLoad(url));
  const csv = CSV.decode(data);
  return csv;
};
CSV.makeTable = (csv) => {
  const c = (tag) => document.createElement(tag);
  const tbl = c("table");
  const tr0 = c("tr");
  tbl.appendChild(tr0);
  for (let i = 0; i < csv[0].length; i++) {
    const th = c("th");
    tr0.appendChild(th);
    th.textContent = csv[0][i];
  }
  for (let i = 1; i < csv.length; i++) {
    const tr = c("tr");
    tbl.appendChild(tr);
    for (let j = 0; j < csv[i].length; j++) {
      const td = c("td");
      tr.appendChild(td);
      const s = csv[i][j];
      if (typeof s == "string" && (s.startsWith("http://") || s.startsWith("https://"))) {
        const a = c("a");
        a.href = a.textContent = s;
        td.appendChild(a);
      } else {
        td.textContent = s;
      }
    }
  }
  return tbl;
};

export { CSV };
