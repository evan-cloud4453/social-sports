// 단답(빈칸 채우기·답 맞추기) 채점 — 사이트(app.js)와 검사 스크립트(node)가 함께 쓴다.
(function (root) {
  "use strict";

  // 비교용 정규화: 소문자, 위·아래첨자 숫자 → 숫자, 곱하기·범위 기호 통일, 공백·문장부호 제거.
  // 소수점(숫자 사이의 점)은 남겨 0.025와 0025가 섞이지 않게 한다.
  var SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹", SUB = "₀₁₂₃₄₅₆₇₈₉";
  function norm(s) {
    s = String(s).toLowerCase()
      .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, function (c) { return String(SUP.indexOf(c)); })
      .replace(/[₀₁₂₃₄₅₆₇₈₉]/g, function (c) { return String(SUB.indexOf(c)); })
      .replace(/[⁻₋−–—]/g, "-").replace(/[⁺₊]/g, "+")
      .replace(/[×✕✖]|\*/g, "x").replace(/\^/g, "")
      .replace(/[∼〜～]/g, "~").replace(/[→⇒>]/g, "")
      .replace(/\s+/g, "");
    s = s.replace(/(\d)-(?=\d)/g, "$1~")           // 범위 60-70 → 60~70
      .replace(/(\d),(?=\d{3}(?!\d))/g, "$1")       // 천 단위 쉼표
      .replace(/\.(?!\d)|(^|[^\d])\./g, "$1")       // 숫자 사이가 아닌 점
      .replace(/[()（）\[\]]+/g, "|")               // 괄호는 경계로 남긴다: 근파워(순발력) → 근파워|순발력
      .replace(/[,·•「」『』'"‘’“”_?!]/g, "")
      .replace(/\|+/g, "|").replace(/^\||\|$/g, "");
    return s;
  }
  // a가 v 안에 있는가. a의 끝이 숫자면 그 자리 옆이 숫자·소수점이 아니어야 한다(6이 60에 맞지 않게).
  // 한 글자 답은 앞뒤가 문자열 끝이나 괄호 경계일 때만 인정한다.
  function hit(v, a) {
    if (!a) return false;
    if (v === a) return true;
    var dHead = /\d/.test(a.charAt(0)), dTail = /\d/.test(a.charAt(a.length - 1));
    var lone = a.length < 2 && !dHead;
    var i = v.indexOf(a);
    while (i !== -1) {
      var b = v.charAt(i - 1), n = v.charAt(i + a.length);
      if (lone) { if ((b === "" || b === "|") && (n === "" || n === "|")) return true; }
      else if ((!dHead || !/[\d.]/.test(b)) && (!dTail || !/[\d.]/.test(n))) return true;
      i = v.indexOf(a, i + 1);
    }
    return false;
  }
  // 빈칸 하나의 입력 v가 허용 표현 묶음 alts에 맞는가. '!'로 시작하는 거부어가 들어 있으면 오답.
  function blankOk(v, alts) {
    v = norm(v || "");
    if (!v) return false;
    var ok = false;
    for (var j = 0; j < alts.length; j++) {
      var a = alts[j];
      if (a.charAt(0) === "!") { if (v.indexOf(norm(a.slice(1))) !== -1) return false; }
      else if (hit(v, norm(a))) ok = true;
    }
    return ok;
  }
  // 빈칸별 정오. anyOrder의 각 묶음(빈칸 번호 배열)은 순서가 바뀌어도 되므로,
  // 묶음 안에서 입력과 정답을 최대한 짝지어(이분 매칭) 맞은 칸을 정한다. 같은 답을 두 번 써도 한 번만 인정.
  function gradeShort(q, inputs) {
    var res = q.accept.map(function (alts, i) { return blankOk(inputs[i], alts); });
    (q.anyOrder || []).forEach(function (g) {
      // 같은 말을 두 칸에 쓰면 앞 칸만 짝짓기에 넣는다(허용어 묶음이 같은 목록형도 중복 인정 안 함)
      var seenIn = {};
      var okm = g.map(function (bi) {
        var key = norm(inputs[bi] || "");
        var dup = key && seenIn[key]; if (key) seenIn[key] = true;
        return g.map(function (aj) { return !dup && blankOk(inputs[bi], q.accept[aj]); });
      });
      var match = g.map(function () { return -1; });   // 정답 칸 j에 짝지은 입력 칸 i
      function aug(i, seen) {
        for (var j = 0; j < g.length; j++) {
          if (!okm[i][j] || seen[j]) continue;
          seen[j] = true;
          if (match[j] === -1 || aug(match[j], seen)) { match[j] = i; return true; }
        }
        return false;
      }
      var got = g.map(function () { return false; });
      for (var i = 0; i < g.length; i++) if (aug(i, g.map(function () { return false; }))) { /* 짝 찾음 */ }
      match.forEach(function (i) { if (i !== -1) got[i] = true; });
      g.forEach(function (bi, i) { res[bi] = got[i]; });
    });
    return res;
  }
  function shortOk(q, inputs) { return gradeShort(q, inputs).every(Boolean); }

  var api = { norm: norm, hit: hit, blankOk: blankOk, gradeShort: gradeShort, shortOk: shortOk };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.QuizGrade = api;
})(typeof window !== "undefined" ? window : this);
