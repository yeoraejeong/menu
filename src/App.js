import React, { useState, useEffect } from "react";

const API_KEY = "a63b8a36cb7f4971bdcc868a91dd25c5";
const EDU_CODE = "J10";
const SCH_CODE = "7530909";
const MEAL_LABEL = ["조식", "중식", "석식"];

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}
function getDay(dateStr) {
  return new Date(dateStr).getDay();
}

// 메뉴에서 *-(조), (밥), (국), (소스), (후식) 등 괄호내용 제거 & 뒤쪽 알러지번호만 추출
function parseMenu(ddishNm) {
  return ddishNm
    .split("<br/>")
    .map(raw => {
      // 알러지정보 (숫자) 괄호로 끝나는 경우 분리
      const match = raw.match(/^(.*?)(\(\d+(?:\.\d+)*\))?$/);
      let menu = match ? match[1].replace(/ *-.*$/, "") : raw;
      // 괄호 중간에 (밥), (국), (소스), (후식) 등은 삭제
      menu = menu.replace(/\((조|밥|국|소스|후식|샐러드|무침|볶음|구이|찜|튀김|볶음밥|스프|치즈|드레싱|라이스|스튜|볼|탕|장|면|스테이크|그라탕|롤|죽|볶음|반찬|디저트|식|음료)\)/g, "");
      // 메뉴 앞뒤 공백 정리
      menu = menu.trim();
            // *조, *중, *석 등 앞뒤 제거
      menu = menu.replace(/^\*?[조중석]\s*/, "").replace(/\s*\*?[조중석]$/, "");
      // 알러지 번호만 따로 추출
      const allergyMatch = raw.match(/\((\d+(?:\.\d+)*)\)$/);
      const allergy = allergyMatch ? allergyMatch[1] : "";
      return { menu, allergy };
    })
    .filter(item => item.menu !== "");
}

export default function App() {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(formatDate(today));
  const [selectedMeal, setSelectedMeal] = useState(1);
  const [meals, setMeals] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [noMealDay, setNoMealDay] = useState(false);

  useEffect(() => {
    async function fetchMeal() {
      setLoading(true);
      setError(null);
      setMeals(null);
      setNoMealDay(false);
      const dow = getDay(selectedDate);
      if (dow === 0 || dow === 6) {
        setNoMealDay(true);
        setLoading(false);
        setMeals(null);
        return;
      }
      const dateStr = selectedDate.replace(/-/g, "");
      const url = `https://open.neis.go.kr/hub/mealServiceDietInfo?KEY=${API_KEY}&ATPT_OFCDC_SC_CODE=${EDU_CODE}&SD_SCHUL_CODE=${SCH_CODE}&MLSV_YMD=${dateStr}&Type=json`;
      try {
        const res = await fetch(url);
        const js = await res.json();
        const rows = js?.mealServiceDietInfo?.[1]?.row;
        setMeals(rows || []);
      } catch {
        setError("서버 오류");
      } finally {
        setLoading(false);
      }
    }
    fetchMeal();
  }, [selectedDate]);

  const mealCodes = meals ? meals.map(row => parseInt(row.MMEAL_SC_CODE)) : [];
  const selectedMealRow = meals
    ? meals.find(x => parseInt(x.MMEAL_SC_CODE) === selectedMeal)
    : null;

  // 스타일
  const iosShadow = "0 8px 28px 0 rgba(30,35,90,0.07), 0 1.5px 4px 0 rgba(0,0,0,0.02)";
  const iosCard = {
    background: "#fff",
    borderRadius: "25px",
    boxShadow: iosShadow,
    padding: "2em 1.1em 2.1em 1.1em",
    marginTop: "2.1em",
    minHeight: "80px",
    fontSize: "0.93em",
    color: "#222",
    transition: "box-shadow .2s",
  };
  const iosBtn = {
    background: "#f4f5f8",
    border: "none",
    borderRadius: "12px",
    fontSize: "0.95em",
    padding: "0.7em 0",
    margin: "0 7px",
    flex: 1,
    fontWeight: 500,
    boxShadow: "0 2px 10px 0 rgba(30,35,90,0.03)",
    cursor: "pointer",
    outline: "none",
    transition: "background .2s, box-shadow .2s",
  };
  const iosBtnSel = {
    background: "#f7fafd",
    boxShadow: "0 3.5px 16px 0 rgba(30,35,90,0.10)",
    border: "1.5px solid #e6ecf5"
  };
  const iosBtnGray = {
    background: "#f6f6f7",
    color: "#c4c4c4",
    pointerEvents: "none",
    opacity: 1,
    fontWeight: 400,
  };
  const dateInputStyle = {
    fontSize: "0.93em",
    padding: "0.7em 1em",
    borderRadius: "12px",
    border: "1px solid #e2e3e8",
    background: "#fff",
    color: "#23272e",
    outline: "none",
    fontWeight: 500,
    boxSizing: "border-box",
    width: "auto",
    minWidth: "140px",
  };
  const menuText = {
    fontSize: "0.93em",
    lineHeight: "1.8",
    margin: "0.4em 0",
    color: "#23272e",
    display: "flex",
    alignItems: "center",
    gap: 6
  };
  const menuAllergy = {
    fontSize: "0.78em",
    color: "#b7b9be",
    fontWeight: 400,
    letterSpacing: "-0.01em"
  };

  let mealCardContent;
  const noInfoStyle = { fontSize: "0.93em", color: "#bcbcbc", textAlign: "center" };
  if (loading) {
    mealCardContent = <div style={{ color: "#bbb", fontSize: "1.1em" }}>로딩중...</div>;
  } else if (error || noMealDay || (meals && meals.length === 0) || (!selectedMealRow && meals)) {
    mealCardContent = (
      <div style={noInfoStyle}>
        등록된 정보가 없습니다.
      </div>
    );
  } else if (selectedMealRow) {
    // 메뉴 분리 + 알러지 정보 파싱
    const menuList = parseMenu(selectedMealRow.DDISH_NM || "");
    mealCardContent = (
      <div>
        {menuList.map(({ menu, allergy }, idx) => (
          <div key={menu + idx} style={menuText}>
            <span>{menu}</span>
            {allergy && <span style={menuAllergy}>({allergy})</span>}
          </div>
        ))}
      </div>
    );
  }

  // 전체 배경 및 컨테이너
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f7f7fa",
        padding: "0",
        margin: "0",
        fontFamily: "'SF Pro','Pretendard',sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 430,
          margin: "0 auto",
          padding: "36px 3vw 26px 3vw",
        }}
      >
        <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "13px"}}>
          <h2 style={{
            fontWeight: 700,
            fontSize: "1.35em",
            margin: 0,
            color: "#23272e",
            letterSpacing: "-0.01em"
          }}>
            급식
          </h2>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            style={dateInputStyle}
          />
        </div>        
        <div style={{ display: "flex", gap: "10px", marginTop: 13, marginBottom: 7 }}>
          {MEAL_LABEL.map((label, idx) => {
            const mealCode = idx + 1;
            const hasMeal = meals && meals.length > 0
              ? mealCodes.includes(mealCode)
              : false;
            const isSelected = selectedMeal === mealCode;
            const disabled = noMealDay
              || (meals && meals.length > 0 && !hasMeal)
              || (meals && meals.length === 0);
            return (
              <button
                key={label}
                onClick={() => setSelectedMeal(mealCode)}
                disabled={disabled}
                style={{
                  ...iosBtn,
                  ...(isSelected ? iosBtnSel : {}),
                  ...(disabled ? iosBtnGray : {}),
                  fontSize: "1.05em"
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
        <div style={iosCard}>
          {mealCardContent}
        </div>
      </div>
    </div>
  );
}