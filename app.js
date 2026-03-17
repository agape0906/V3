(() => {
  const STORAGE_KEY = "recruit-tracker-pro.v1";
  const STATUS_OPTIONS = [
    { value: "applied", label: "応募" },
    { value: "screening", label: "書類選考" },
    { value: "interview", label: "面接中" },
    { value: "offer", label: "内定" },
    { value: "hired", label: "採用" },
    { value: "rejected", label: "不採用" },
    { value: "withdrawn", label: "辞退" }
  ];
  const PRIORITY_OPTIONS = [
    { value: "high", label: "高" },
    { value: "medium", label: "中" },
    { value: "low", label: "低" }
  ];
  const INTERVIEW_LOCATION_OPTIONS = [
    { value: "naniwa", label: "なにわ" },
    { value: "tamatsukuri", label: "玉造" },
    { value: "sakai", label: "堺" },
    { value: "remote", label: "リモート" },
    { value: "other", label: "その他" }
  ];
  const INTERVIEW_LOCATION_SET = new Set(INTERVIEW_LOCATION_OPTIONS.map((v) => v.value));
  const HEARING_QUESTIONS = [
    { key: "q1", label: "①これまでの経歴と退職理由" },
    { key: "q2", label: "②なぜ介護職か／なぜ訪問介護か" },
    { key: "q3", label: "③仕事で大変だったことと対応方法" },
    { key: "q4", label: "④上司から納得できない指示があったとき、どのように対応しますか？" },
    { key: "q5", label: "⑤仕事をするうえで大切にしていることと、ストレスが溜まったときのリフレッシュ方法" }
  ];
  const EVALUATION_SCORE_ITEMS = [
    { key: "greeting", label: "挨拶・受け答え", hint: "入室時の挨拶有無・質疑応答ができているか" },
    { key: "timeSense", label: "時間感覚", hint: "遅刻→1 / ジャスト→2 / 5分前→3 / 10分前→4 / 15分前→5" },
    { key: "careMind", label: "介護観", hint: "介護に対する考え方" },
    { key: "homeCareUnderstanding", label: "訪問介護理解", hint: "訪問介護の理解度" },
    { key: "cleanliness", label: "清潔", hint: "※匂い・歯・髪質・体形・服装" },
    { key: "ownership", label: "自責志向", hint: "課題への向き合い方" },
    { key: "physicalStrength", label: "体力面", hint: "業務遂行体力" },
    { key: "mobilityTolerance", label: "移動耐性", hint: "移動負荷への適応" },
    { key: "qaResponse", label: "質疑応答", hint: "質問したことに対して、返答があるか" },
    { key: "cooperativeness", label: "協調性", hint: "※上司の指示への納得できない場合などから判断" }
  ];
  const COMPANY_OVERVIEW_KEYS = [
    { key: "vision", label: "ビジョン（関西で一番選ばれる訪問介護事業所）" },
    { key: "profitReturn", label: "利益還元の仕組み" },
    { key: "trainingPolicy", label: "不安を確認しながら段階的育成（同行無制限OJT等）" },
    { key: "salesOptional", label: "営業は任意（人事評価に反映）" }
  ];
  const DEMERIT_CHECK_ITEMS = [
    { key: "demerit1", label: "①利用者ごとに対応が異なる" },
    { key: "demerit2", label: "②移動距離・移動時間の負担がある" },
    { key: "demerit3", label: "③雨・暑さ・寒さの影響を受け、体力が必要" },
    { key: "demerit4", label: "④利用者対応で悩むことがある（セクハラ・モラハラ等）" },
    { key: "demerit5", label: "⑤支援だけでなく、相談・記録・ルール順守が必要" }
  ];
  const DANGER_FLAG_KEYS = [
    { key: "conditionsFocus", label: "条件面の話が中心で仕事内容理解が浅い" },
    { key: "healthConcern", label: "疾患や障害を持っている可能性が高い" }
  ];
  const DEFAULT_SOURCE_OPTIONS = ["求人媒体", "エージェント", "リファラル", "ダイレクト", "自社サイト", "その他"];
  const DEFAULT_JOB_OPTIONS = ["介護職", "看護職", "リハビリ職", "事務職", "管理職"];
  const DEFAULT_EMPLOYMENT_OPTIONS = ["正社員", "パート", "契約社員", "業務委託"];
  const DEFAULT_BRANCH_OPTIONS = ["なにわ", "玉造", "堺"];
  const SETTINGS_OPTION_META = {
    sourceOptions: { label: "採用ソース", listId: "settings-source-list", inputId: "settings-source-new", fallback: DEFAULT_SOURCE_OPTIONS },
    jobOptions: { label: "職種", listId: "settings-job-list", inputId: "settings-job-new", fallback: DEFAULT_JOB_OPTIONS },
    employmentOptions: {
      label: "雇用形態",
      listId: "settings-employment-list",
      inputId: "settings-employment-new",
      fallback: DEFAULT_EMPLOYMENT_OPTIONS
    },
    branchOptions: { label: "応募支店", listId: "settings-branch-list", inputId: "settings-branch-new", fallback: DEFAULT_BRANCH_OPTIONS }
  };
  const STATUS_SET = new Set(STATUS_OPTIONS.map((v) => v.value));
  const PRIORITY_SET = new Set(PRIORITY_OPTIONS.map((v) => v.value));
  const RESOLVED = new Set(["hired", "rejected", "withdrawn"]);
  const PRIORITY_ORDER = { high: 3, medium: 2, low: 1 };
  const AUTH_STORAGE_KEY = "recruit-tracker-pro.auth";
  const AUTH_PASSWORD = "agape2202";

  let state = createDefaultState();
  let toastTimer = null;

  function createDefaultState() {
    return {
      candidates: [],
      interviews: [],
      evaluations: [],
      settings: {
        companyName: "",
        monthlyTarget: 3,
        reminderDays: 5,
        sourceOptions: [...DEFAULT_SOURCE_OPTIONS],
        jobOptions: [...DEFAULT_JOB_OPTIONS],
        employmentOptions: [...DEFAULT_EMPLOYMENT_OPTIONS],
        branchOptions: [...DEFAULT_BRANCH_OPTIONS]
      },
      ui: { candidateStatusFilter: "all" }
    };
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function uid(prefix) {
    return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  }

  function parseDate(value) {
    if (!value || typeof value !== "string") return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(`${value}T00:00:00`);
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function safeDateValue(date) {
    return date ? date.getTime() : 0;
  }

  function formatDate(value) {
    const date = parseDate(value);
    if (!date) return "-";
    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
  }

  function formatDateTime(value) {
    const date = parseDate(value);
    if (!date) return "-";
    return date.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function toDateInputValue(value) {
    const date = parseDate(value);
    if (!date) return "";
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  function toDatetimeLocalValue(value) {
    const date = parseDate(value);
    if (!date) return "";
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  }

  function fromDatetimeLocalValue(value) {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString();
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function truncate(value, max = 90) {
    const text = String(value ?? "");
    return text.length > max ? `${text.slice(0, max)}...` : text;
  }

  function percent(num) {
    return `${Math.round(num)}%`;
  }

  function labelForStatus(status) {
    return STATUS_OPTIONS.find((v) => v.value === status)?.label || "未設定";
  }

  function labelForPriority(priority) {
    return PRIORITY_OPTIONS.find((v) => v.value === priority)?.label || "中";
  }

  function clampScore(value) {
    return Math.min(5, Math.max(1, Number(value) || 3));
  }

  function calcThreeAxisAverage(skill, communication, culture) {
    return Number(((clampScore(skill) + clampScore(communication) + clampScore(culture)) / 3).toFixed(1));
  }

  function calcFinalEvaluationAverage(evaluator1Total, evaluator2Total) {
    return Number(((Number(evaluator1Total) + Number(evaluator2Total)) / 2).toFixed(1));
  }

  function buildDefaultScoreMap(baseScore = 3) {
    return Object.fromEntries(EVALUATION_SCORE_ITEMS.map((item) => [item.key, clampScore(baseScore)]));
  }

  function calcScoreSheetTotal(scoreMap) {
    return EVALUATION_SCORE_ITEMS.reduce((sum, item) => sum + clampScore(scoreMap[item.key]), 0);
  }

  function isEvaluationSubmitted(submittedAt) {
    return Boolean(String(submittedAt || "").trim());
  }

  function hasFinalEvaluation(evaluation) {
    return isEvaluationSubmitted(evaluation?.evaluator1SubmittedAt) && isEvaluationSubmitted(evaluation?.evaluator2SubmittedAt);
  }

  function calcFinalEvaluationTotal(evaluation) {
    if (!hasFinalEvaluation(evaluation)) return null;
    const total1 = Number(evaluation?.evaluator1Total) || 0;
    const total2 = Number(evaluation?.evaluator2Total) || 0;
    return calcFinalEvaluationAverage(total1, total2);
  }

  function averageScoreForItem(score1, score2) {
    return Number(((clampScore(score1) + clampScore(score2)) / 2).toFixed(1));
  }

  function isMeetingUrlRequired(locationType) {
    return locationType === "remote" || locationType === "other";
  }

  function isValidHttpUrl(value) {
    return /^https?:\/\/\S+$/i.test(String(value || "").trim());
  }

  function extractUrlFromText(value) {
    const text = String(value || "");
    const match = text.match(/https?:\/\/\S+/i);
    return match ? match[0] : "";
  }

  function inferInterviewLocationType(locationText, meetingUrl) {
    const text = String(locationText || "").toLowerCase();
    if (meetingUrl || text.includes("http") || text.includes("online") || text.includes("zoom") || text.includes("teams")) {
      return "remote";
    }
    if (text.includes("なにわ")) return "naniwa";
    if (text.includes("玉造")) return "tamatsukuri";
    if (text.includes("堺")) return "sakai";
    if (!text) return "naniwa";
    return "other";
  }

  function getInterviewLocationLabel(interview) {
    const type = INTERVIEW_LOCATION_SET.has(interview.locationType) ? interview.locationType : "naniwa";
    const label = INTERVIEW_LOCATION_OPTIONS.find((v) => v.value === type)?.label || "なにわ";
    if (type === "other" && interview.customLocation) {
      return `${label}（${interview.customLocation}）`;
    }
    return label;
  }

  function getInterviewersLabel(interview) {
    const names = [interview.interviewerPrimary, interview.interviewerSecondary].map((v) => String(v || "").trim()).filter(Boolean);
    return names.length ? names.join(" / ") : "未設定";
  }

  function setCandidateStatus(candidate, nextStatus) {
    if (!candidate || !STATUS_SET.has(nextStatus)) return;
    candidate.status = nextStatus;
    if (nextStatus === "hired" && !candidate.hiredAt) {
      candidate.hiredAt = toDateInputValue(nowIso());
    }
    if (nextStatus !== "hired" && candidate.hiredAt && nextStatus !== "offer") {
      candidate.hiredAt = "";
    }
    candidate.updatedAt = nowIso();
  }

  function applyInterviewResultStatus(candidate, result, interviewType) {
    if (!candidate) return;
    if (result === "fail") {
      setCandidateStatus(candidate, "rejected");
      return;
    }
    if (result === "pass" && interviewType === "最終") {
      setCandidateStatus(candidate, "offer");
      return;
    }
    if (!RESOLVED.has(candidate.status)) {
      setCandidateStatus(candidate, "interview");
    }
  }

  function getSettingOptionList(settingKey, fallbackOptions = SETTINGS_OPTION_META[settingKey]?.fallback || []) {
    const values = Array.isArray(state.settings[settingKey]) ? state.settings[settingKey] : [];
    const normalized = values.map((v) => String(v || "").trim()).filter(Boolean);
    return normalized.length ? normalized : [...fallbackOptions];
  }

  function getSourceOptions() {
    return getSettingOptionList("sourceOptions", DEFAULT_SOURCE_OPTIONS);
  }

  function getJobOptions() {
    return getSettingOptionList("jobOptions", DEFAULT_JOB_OPTIONS);
  }

  function getEmploymentOptions() {
    return getSettingOptionList("employmentOptions", DEFAULT_EMPLOYMENT_OPTIONS);
  }

  function getBranchOptions() {
    return getSettingOptionList("branchOptions", DEFAULT_BRANCH_OPTIONS);
  }

  function getPage() {
    return document.body?.dataset.page || "home";
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function normalizeState(raw) {
    const base = createDefaultState();
    if (!raw || typeof raw !== "object") return base;

    base.candidates = (Array.isArray(raw.candidates) ? raw.candidates : [])
      .map((v) => {
        if (!v || typeof v !== "object") return null;
        const name = String(v.name || "").trim();
        if (!name) return null;
        return {
          id: typeof v.id === "string" ? v.id : uid("cand"),
          name,
          kana: String(v.kana || ""),
          phone: String(v.phone || ""),
          email: String(v.email || ""),
          source: String(v.source || ""),
          jobCategory: String(v.jobCategory || ""),
          employmentType: String(v.employmentType || ""),
          appliedBranch: String(v.appliedBranch || ""),
          status: STATUS_SET.has(v.status) ? v.status : "applied",
          priority: PRIORITY_SET.has(v.priority) ? v.priority : "medium",
          appliedAt: String(v.appliedAt || ""),
          hiredAt: String(v.hiredAt || ""),
          notes: String(v.notes || ""),
          createdAt: String(v.createdAt || nowIso()),
          updatedAt: String(v.updatedAt || nowIso())
        };
      })
      .filter(Boolean);

    const idSet = new Set(base.candidates.map((c) => c.id));

    base.interviews = (Array.isArray(raw.interviews) ? raw.interviews : [])
      .map((v) => {
        if (!v || typeof v !== "object" || !idSet.has(v.candidateId)) return null;
        const inferredLocationType = inferInterviewLocationType(v.location, v.meetingUrl);
        const locationType = INTERVIEW_LOCATION_SET.has(v.locationType) ? v.locationType : inferredLocationType;
        const meetingUrl = String(v.meetingUrl || extractUrlFromText(v.location) || "").trim();
        const customLocation = String(v.customLocation || "").trim();
        return {
          id: typeof v.id === "string" ? v.id : uid("int"),
          candidateId: v.candidateId,
          scheduledAt: String(v.scheduledAt || ""),
          type: String(v.type || "一次"),
          interviewerPrimary: String(v.interviewerPrimary || v.interviewer || "").trim(),
          interviewerSecondary: String(v.interviewerSecondary || "").trim(),
          locationType,
          customLocation: locationType === "other" ? (customLocation || String(v.location || "").trim()) : customLocation,
          meetingUrl: isMeetingUrlRequired(locationType) ? meetingUrl : "",
          result: String(v.result || "scheduled"),
          notes: String(v.notes || ""),
          createdAt: String(v.createdAt || nowIso()),
          updatedAt: String(v.updatedAt || nowIso())
        };
      })
      .filter(Boolean);

    base.evaluations = (Array.isArray(raw.evaluations) ? raw.evaluations : [])
      .map((v) => {
        if (!v || typeof v !== "object" || !idSet.has(v.candidateId)) return null;
        const fallbackScore1 = clampScore(v.evaluator1Skill ?? v.skill);
        const fallbackScore2 = clampScore(v.evaluator2Skill ?? v.skill);
        const evaluator1Scores = buildDefaultScoreMap(fallbackScore1);
        const evaluator2Scores = buildDefaultScoreMap(fallbackScore2);
        EVALUATION_SCORE_ITEMS.forEach((item) => {
          evaluator1Scores[item.key] = clampScore(v.evaluator1Scores?.[item.key] ?? v[`evaluator1_${item.key}`] ?? evaluator1Scores[item.key]);
          evaluator2Scores[item.key] = clampScore(v.evaluator2Scores?.[item.key] ?? v[`evaluator2_${item.key}`] ?? evaluator2Scores[item.key]);
        });
        const hasLegacySingleEvaluatorData =
          Number(v.total) > 0 || Number(v.skill) > 0 || Number(v.communication) > 0 || Number(v.culture) > 0;
        const hasLegacyEvaluator1Data =
          hasLegacySingleEvaluatorData ||
          Boolean(v.evaluator1Scores) ||
          Number(v.evaluator1Total) > 0 ||
          EVALUATION_SCORE_ITEMS.some((item) => v[`evaluator1_${item.key}`] !== undefined);
        const hasLegacyEvaluator2Data =
          hasLegacySingleEvaluatorData ||
          Boolean(v.evaluator2Scores) ||
          Number(v.evaluator2Total) > 0 ||
          EVALUATION_SCORE_ITEMS.some((item) => v[`evaluator2_${item.key}`] !== undefined);
        const evaluator1SubmittedAt = String(v.evaluator1SubmittedAt || (hasLegacyEvaluator1Data ? v.updatedAt || nowIso() : ""));
        const evaluator2SubmittedAt = String(v.evaluator2SubmittedAt || (hasLegacyEvaluator2Data ? v.updatedAt || nowIso() : ""));
        const evaluator1Total = Number(v.evaluator1Total) || calcScoreSheetTotal(evaluator1Scores);
        const evaluator2Total = Number(v.evaluator2Total) || calcScoreSheetTotal(evaluator2Scores);
        const explicitTotal = Number(v.total);
        const total =
          isEvaluationSubmitted(evaluator1SubmittedAt) && isEvaluationSubmitted(evaluator2SubmittedAt)
            ? Number.isFinite(explicitTotal) && explicitTotal > 0
              ? explicitTotal
              : calcFinalEvaluationAverage(evaluator1Total, evaluator2Total)
            : null;
        const interviewId = typeof v.interviewId === "string" ? v.interviewId : "";
        const legacyDemeritChecked = Boolean(v.overviewChecklist?.demeritExplained);
        return {
          id: typeof v.id === "string" ? v.id : uid("eva"),
          candidateId: v.candidateId,
          interviewId,
          evaluator1Name: String(v.evaluator1Name || "面接担当1").trim(),
          evaluator2Name: String(v.evaluator2Name || "面接担当2").trim(),
          evaluator1Scores,
          evaluator2Scores,
          evaluator1Total,
          evaluator2Total,
          total,
          evaluator1SubmittedAt,
          evaluator2SubmittedAt,
          questionRecorderName: String(v.questionRecorderName || ""),
          questionAnswers: {
            q1: String(v.questionAnswers?.q1 || v.qa1 || ""),
            q2: String(v.questionAnswers?.q2 || v.qa2 || ""),
            q3: String(v.questionAnswers?.q3 || v.qa3 || ""),
            q4: String(v.questionAnswers?.q4 || v.qa4 || ""),
            q5: String(v.questionAnswers?.q5 || v.qa5 || "")
          },
          overviewChecklist: {
            vision: Boolean(v.overviewChecklist?.vision),
            profitReturn: Boolean(v.overviewChecklist?.profitReturn),
            trainingPolicy: Boolean(v.overviewChecklist?.trainingPolicy),
            salesOptional: Boolean(v.overviewChecklist?.salesOptional),
            demerit1: Boolean(v.overviewChecklist?.demerit1 ?? legacyDemeritChecked),
            demerit2: Boolean(v.overviewChecklist?.demerit2 ?? legacyDemeritChecked),
            demerit3: Boolean(v.overviewChecklist?.demerit3 ?? legacyDemeritChecked),
            demerit4: Boolean(v.overviewChecklist?.demerit4 ?? legacyDemeritChecked),
            demerit5: Boolean(v.overviewChecklist?.demerit5 ?? legacyDemeritChecked)
          },
          anxietyPoint: String(v.anxietyPoint || ""),
          gapPoint: String(v.gapPoint || ""),
          pamphletShared: Boolean(v.pamphletShared),
          interviewClosed: Boolean(v.interviewClosed),
          dangerFlags: {
            conditionsFocus: Boolean(v.dangerFlags?.conditionsFocus),
            healthConcern: Boolean(v.dangerFlags?.healthConcern)
          },
          evaluator1Comment: String(v.evaluator1Comment || ""),
          evaluator2Comment: String(v.evaluator2Comment || ""),
          comment: String(v.comment || ""),
          createdAt: String(v.createdAt || nowIso()),
          updatedAt: String(v.updatedAt || nowIso())
        };
      })
      .filter(Boolean);

    if (raw.settings && typeof raw.settings === "object") {
      base.settings.companyName = String(raw.settings.companyName || "");
      base.settings.monthlyTarget = Math.max(1, Number(raw.settings.monthlyTarget) || 3);
      base.settings.reminderDays = Math.max(1, Number(raw.settings.reminderDays) || 5);
      base.settings.sourceOptions = Array.isArray(raw.settings.sourceOptions)
        ? raw.settings.sourceOptions.map((v) => String(v || "").trim()).filter(Boolean)
        : [...DEFAULT_SOURCE_OPTIONS];
      if (!base.settings.sourceOptions.length) {
        base.settings.sourceOptions = [...DEFAULT_SOURCE_OPTIONS];
      }
      base.settings.jobOptions = Array.isArray(raw.settings.jobOptions)
        ? raw.settings.jobOptions.map((v) => String(v || "").trim()).filter(Boolean)
        : [...DEFAULT_JOB_OPTIONS];
      if (!base.settings.jobOptions.length) {
        base.settings.jobOptions = [...DEFAULT_JOB_OPTIONS];
      }
      base.settings.employmentOptions = Array.isArray(raw.settings.employmentOptions)
        ? raw.settings.employmentOptions.map((v) => String(v || "").trim()).filter(Boolean)
        : [...DEFAULT_EMPLOYMENT_OPTIONS];
      if (!base.settings.employmentOptions.length) {
        base.settings.employmentOptions = [...DEFAULT_EMPLOYMENT_OPTIONS];
      }
      base.settings.branchOptions = Array.isArray(raw.settings.branchOptions)
        ? raw.settings.branchOptions.map((v) => String(v || "").trim()).filter(Boolean)
        : [...DEFAULT_BRANCH_OPTIONS];
      if (!base.settings.branchOptions.length) {
        base.settings.branchOptions = [...DEFAULT_BRANCH_OPTIONS];
      }
    }
    if (raw.ui && typeof raw.ui === "object") {
      const filter = raw.ui.candidateStatusFilter;
      base.ui.candidateStatusFilter = filter === "all" || STATUS_SET.has(filter) ? filter : "all";
    }

    return base;
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return createDefaultState();
      return normalizeState(JSON.parse(raw));
    } catch (_error) {
      return createDefaultState();
    }
  }

  function showToast(message) {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = message;
    el.classList.add("show");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2400);
  }

  function isAuthenticated() {
    try {
      return sessionStorage.getItem(AUTH_STORAGE_KEY) === "ok";
    } catch (_error) {
      return false;
    }
  }

  function showAuthGate() {
    if (document.getElementById("auth-gate")) return;
    const gate = document.createElement("div");
    gate.id = "auth-gate";
    gate.className = "auth-gate";
    gate.innerHTML = `
      <div class="auth-card">
        <h1 class="auth-title">アガペの里　採用トラッカーへ</h1>
        <p class="auth-sub">アクセスするにはパスワードを入力してください。</p>
        <form id="auth-form">
          <label class="form-row">
            <span class="form-label">パスワード</span>
            <input class="form-input" type="password" id="auth-password-input" autocomplete="current-password" required>
          </label>
          <p class="auth-error" id="auth-error"></p>
          <button class="btn btn-primary" type="submit"><i class="fa-solid fa-lock-open"></i> ログイン</button>
        </form>
      </div>
    `;
    document.body.appendChild(gate);

    const form = document.getElementById("auth-form");
    const input = document.getElementById("auth-password-input");
    const errorEl = document.getElementById("auth-error");
    input?.focus();
    form?.addEventListener("submit", (event) => {
      event.preventDefault();
      const value = String(input?.value || "");
      if (value === AUTH_PASSWORD) {
        try {
          sessionStorage.setItem(AUTH_STORAGE_KEY, "ok");
        } catch (_error) {
          /* no-op */
        }
        gate.remove();
        activateNav();
        renderPage();
        showToast("ログインしました。");
        return;
      }
      if (errorEl) {
        errorEl.textContent = "パスワードが違います。";
      }
      if (input) {
        input.value = "";
        input.focus();
      }
    });
  }

  function ensureAuthenticated() {
    if (isAuthenticated()) return true;
    showAuthGate();
    return false;
  }

  function activateNav() {
    const page = getPage();
    document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.page === page));
  }

  function findCandidate(id) {
    return state.candidates.find((c) => c.id === id) || null;
  }

  function findInterview(id) {
    return state.interviews.find((interview) => interview.id === id) || null;
  }

  function candidateName(id) {
    return findCandidate(id)?.name || "削除済み候補者";
  }

  function emptyHtml(message) {
    return `<div class="empty-state">${escapeHtml(message)}</div>`;
  }

  function closeModal() {
    const root = document.getElementById("modal-root");
    if (root) root.innerHTML = "";
  }

  function openModal({ title, body, submitText, onSubmit }) {
    const root = document.getElementById("modal-root");
    if (!root) return;
    root.innerHTML = `
      <div class="modal-backdrop" id="modal-backdrop">
        <div class="modal-card">
          <div class="modal-head">
            <h2 class="modal-title">${escapeHtml(title)}</h2>
            <button type="button" class="modal-close" id="modal-close"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <form id="modal-form">
            <div class="modal-body">${body}</div>
            <div class="modal-foot">
              <button type="button" class="btn btn-secondary" id="modal-cancel">キャンセル</button>
              <button type="submit" class="btn btn-primary">${submitText}</button>
            </div>
          </form>
        </div>
      </div>
    `;
    const backdrop = document.getElementById("modal-backdrop");
    document.getElementById("modal-close")?.addEventListener("click", closeModal);
    document.getElementById("modal-cancel")?.addEventListener("click", closeModal);
    backdrop?.addEventListener("click", (event) => {
      if (event.target === backdrop) closeModal();
    });
    document.getElementById("modal-form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      onSubmit(new FormData(event.currentTarget));
    });
  }

  function metricData() {
    const now = new Date();
    const totalCandidates = state.candidates.length;
    const interviewIds = new Set(state.interviews.map((v) => v.candidateId));
    const interviewed = state.candidates.filter(
      (v) => interviewIds.has(v.id) || v.status === "interview" || v.status === "offer" || v.status === "hired"
    ).length;
    const offered = state.candidates.filter((v) => v.status === "offer" || v.status === "hired").length;
    const inProgress = state.candidates.filter((v) => !RESOLVED.has(v.status)).length;
    const interviewRate = totalCandidates ? (interviewed / totalCandidates) * 100 : 0;
    const offerRate = totalCandidates ? (offered / totalCandidates) * 100 : 0;
    const hiredThisMonth = state.candidates.filter((v) => {
      if (v.status !== "hired") return false;
      const d = parseDate(v.hiredAt || v.updatedAt);
      return d && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }).length;

    const diffs = state.candidates
      .map((candidate) => {
        const applied = parseDate(candidate.appliedAt);
        if (!applied) return null;
        const firstInterview = state.interviews
          .filter((v) => v.candidateId === candidate.id && parseDate(v.scheduledAt))
          .sort((a, b) => safeDateValue(parseDate(a.scheduledAt)) - safeDateValue(parseDate(b.scheduledAt)))[0];
        if (!firstInterview) return null;
        const firstDate = parseDate(firstInterview.scheduledAt);
        const diff = Math.round((firstDate.getTime() - applied.getTime()) / (24 * 60 * 60 * 1000));
        return diff >= 0 ? diff : null;
      })
      .filter((v) => v !== null);
    const avgDays = diffs.length ? Number((diffs.reduce((sum, v) => sum + v, 0) / diffs.length).toFixed(1)) : null;
    const score = Math.min(100, Math.round(interviewRate * 0.55 + offerRate * 0.45));

    const upcomingInterviews = state.interviews
      .filter((v) => {
        const d = parseDate(v.scheduledAt);
        if (!d) return false;
        const delta = d.getTime() - now.getTime();
        return delta >= 0 && delta <= 7 * 24 * 60 * 60 * 1000;
      })
      .sort((a, b) => safeDateValue(parseDate(a.scheduledAt)) - safeDateValue(parseDate(b.scheduledAt)));

    const priorityCandidates = state.candidates
      .filter((v) => v.priority === "high" && !RESOLVED.has(v.status))
      .sort((a, b) => safeDateValue(parseDate(b.updatedAt)) - safeDateValue(parseDate(a.updatedAt)))
      .slice(0, 8);

    const sourceMap = {};
    state.candidates.forEach((candidate) => {
      const source = candidate.source || "未設定";
      if (!sourceMap[source]) sourceMap[source] = { source, applicants: 0, offers: 0, hired: 0 };
      sourceMap[source].applicants += 1;
      if (candidate.status === "offer" || candidate.status === "hired") sourceMap[source].offers += 1;
      if (candidate.status === "hired") sourceMap[source].hired += 1;
    });
    const sourceStats = Object.values(sourceMap).sort((a, b) => b.applicants - a.applicants);

    const monthlyMap = {};
    const monthlyLabels = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyMap[key] = 0;
      monthlyLabels.push(`${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    state.candidates.forEach((candidate) => {
      const d = parseDate(candidate.hiredAt);
      if (!d) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (Object.prototype.hasOwnProperty.call(monthlyMap, key)) monthlyMap[key] += 1;
    });
    const monthlyHires = monthlyLabels.map((label) => {
      const [year, month] = label.split("/");
      return { label, count: monthlyMap[`${year}-${month}`] || 0 };
    });

    const statusCounts = STATUS_OPTIONS.map((option) => ({
      label: option.label,
      count: state.candidates.filter((v) => v.status === option.value).length
    }));
    const finalizedEvaluations = state.evaluations.filter((v) => hasFinalEvaluation(v) && Number.isFinite(Number(v.total)));
    const evalAvg = finalizedEvaluations.length
      ? Number((finalizedEvaluations.reduce((sum, v) => sum + Number(v.total || 0), 0) / finalizedEvaluations.length).toFixed(1))
      : null;

    return {
      totalCandidates,
      totalInterviews: state.interviews.length,
      offered,
      inProgress,
      interviewRate,
      offerRate,
      hiredThisMonth,
      avgDays,
      score,
      upcomingInterviews,
      priorityCandidates,
      sourceStats,
      monthlyHires,
      statusCounts,
      evalAvg
    };
  }

  function renderHome() {
    const metrics = metricData();
    const setText = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = String(text);
    };

    setText("hero-total-candidates", metrics.totalCandidates);
    setText("hero-in-progress", metrics.inProgress);
    setText("hero-this-month", metrics.hiredThisMonth);
    setText("kpi-total-candidates", metrics.totalCandidates);
    setText("kpi-total-interviews", metrics.totalInterviews);
    setText("kpi-offered", metrics.offered);
    setText("kpi-this-month", metrics.hiredThisMonth);
    setText("summary-interview-rate", percent(metrics.interviewRate));
    setText("summary-offer-rate", percent(metrics.offerRate));
    setText("progress-score", metrics.score);
    setText("kpi-total-interviews-foot", `面接化率 ${percent(metrics.interviewRate)}`);
    setText("kpi-offered-foot", `内定率 ${percent(metrics.offerRate)}`);
    setText("kpi-this-month-foot", `目標 ${state.settings.monthlyTarget || 3}件`);
    setText("summary-days-to-interview", metrics.avgDays === null ? "-" : `${metrics.avgDays}日`);

    const ring = document.getElementById("progress-ring");
    if (ring) ring.style.background = `conic-gradient(var(--brand) ${metrics.score}%, #d8e1ea 0)`;

    const interviewsEl = document.getElementById("dashboard-upcoming-interviews");
    if (interviewsEl) {
      interviewsEl.innerHTML = !metrics.upcomingInterviews.length
        ? emptyHtml("直近7日間に予定された面接はありません。")
        : `<div class="simple-list">${metrics.upcomingInterviews
            .map(
              (v) => `
              <div class="list-item">
                <div>
                  <p class="list-title">${escapeHtml(candidateName(v.candidateId))} / ${escapeHtml(v.type || "面接")}</p>
                  <div class="list-meta">${formatDateTime(v.scheduledAt)} ・ ${escapeHtml(getInterviewersLabel(v))}</div>
                </div>
                <a class="btn btn-soft btn-sm" href="./interviews.html">詳細</a>
              </div>`
            )
            .join("")}</div>`;
    }

    const priorityEl = document.getElementById("dashboard-priority-list");
    if (priorityEl) {
      priorityEl.innerHTML = !metrics.priorityCandidates.length
        ? emptyHtml("優先フォロー対象はありません。")
        : `<div class="simple-list">${metrics.priorityCandidates
            .map(
              (v) => `
              <div class="list-item">
                <div>
                  <p class="list-title">${escapeHtml(v.name)}</p>
                  <div class="list-meta">${escapeHtml(labelForStatus(v.status))} ・ 更新: ${formatDateTime(v.updatedAt)}</div>
                </div>
                <button class="btn btn-soft btn-sm" type="button" onclick="App.openCandidateModal('${v.id}')">編集</button>
              </div>`
            )
            .join("")}</div>`;
    }
  }

  function renderStatusFilters() {
    const el = document.getElementById("status-filters");
    if (!el) return;
    const counts = { all: state.candidates.length };
    STATUS_OPTIONS.forEach((v) => (counts[v.value] = 0));
    state.candidates.forEach((v) => {
      if (Object.prototype.hasOwnProperty.call(counts, v.status)) counts[v.status] += 1;
    });
    const current = state.ui.candidateStatusFilter || "all";
    const chips = [{ value: "all", label: "すべて" }, ...STATUS_OPTIONS]
      .map((v) => {
        const active = v.value === current ? "active" : "";
        return `<button class="chip ${active}" type="button" onclick="App.setCandidateStatusFilter('${v.value}')">${escapeHtml(
          v.label
        )} (${counts[v.value] || 0})</button>`;
      })
      .join("");
    el.innerHTML = chips;
  }

  function renderCandidates() {
    const container = document.getElementById("candidates-list");
    if (!container) return;
    renderStatusFilters();

    const query = (document.getElementById("candidate-search")?.value || "").trim().toLowerCase();
    const sort = document.getElementById("candidate-sort")?.value || "updated_desc";
    const filter = state.ui.candidateStatusFilter || "all";
    const list = state.candidates
      .filter((v) => {
        if (filter !== "all" && v.status !== filter) return false;
        if (!query) return true;
        const text = [v.name, v.kana, v.phone, v.email, v.notes, v.source, v.jobCategory, v.employmentType, v.appliedBranch]
          .join(" ")
          .toLowerCase();
        return text.includes(query);
      })
      .sort((a, b) => {
        if (sort === "name_asc") return a.name.localeCompare(b.name, "ja");
        if (sort === "created_desc") return safeDateValue(parseDate(b.createdAt)) - safeDateValue(parseDate(a.createdAt));
        if (sort === "priority_desc") {
          const p = (PRIORITY_ORDER[b.priority] || 0) - (PRIORITY_ORDER[a.priority] || 0);
          if (p !== 0) return p;
        }
        return safeDateValue(parseDate(b.updatedAt)) - safeDateValue(parseDate(a.updatedAt));
      });

    if (!list.length) {
      container.innerHTML = emptyHtml("条件に一致する候補者がいません。");
      return;
    }

    container.innerHTML = list
      .map(
        (v) => `
        <article class="candidate-card">
          <div class="candidate-header">
            <div>
              <h3 class="candidate-name">${escapeHtml(v.name)}</h3>
              <div class="candidate-meta">${escapeHtml(v.kana || "")}</div>
            </div>
            <div class="badge-row">
              <span class="badge status-${escapeHtml(v.status)}">${escapeHtml(labelForStatus(v.status))}</span>
              <span class="badge priority-${escapeHtml(v.priority)}">優先: ${escapeHtml(labelForPriority(v.priority))}</span>
            </div>
          </div>
          <div class="candidate-meta">
            電話: ${escapeHtml(v.phone || "-")}<br>
            メール: ${escapeHtml(v.email || "-")}<br>
            ソース: ${escapeHtml(v.source || "未設定")}<br>
            職種: ${escapeHtml(v.jobCategory || "未設定")} / 雇用形態: ${escapeHtml(v.employmentType || "未設定")}<br>
            応募支店: ${escapeHtml(v.appliedBranch || "未設定")}<br>
            応募日: ${formatDate(v.appliedAt)} / 更新: ${formatDateTime(v.updatedAt)}
          </div>
          ${v.notes ? `<div class="candidate-meta">備考: ${escapeHtml(truncate(v.notes))}</div>` : ""}
          <div class="candidate-actions">
            <button class="btn btn-soft btn-sm" type="button" onclick="App.openCandidateModal('${v.id}')"><i class="fa-solid fa-pen"></i>編集</button>
            <button class="btn btn-soft btn-sm" type="button" onclick="App.openInterviewModal('${v.id}')"><i class="fa-solid fa-calendar-plus"></i>面接</button>
            <button class="btn btn-soft btn-sm" type="button" onclick="App.openEvaluationModal('${v.id}')"><i class="fa-solid fa-star"></i>評価</button>
            <button class="btn btn-danger btn-sm" type="button" onclick="App.deleteCandidate('${v.id}')"><i class="fa-solid fa-trash"></i>削除</button>
          </div>
        </article>`
      )
      .join("");
  }

  function renderInterviews() {
    const container = document.getElementById("interviews-list");
    if (!container) return;
    if (!state.interviews.length) {
      container.innerHTML = emptyHtml("面接はまだ登録されていません。");
      return;
    }
    const resultMap = {
      scheduled: { label: "予定", className: "status-screening" },
      pass: { label: "通過", className: "status-hired" },
      fail: { label: "見送り", className: "status-rejected" },
      hold: { label: "保留", className: "status-interview" }
    };
    const list = [...state.interviews].sort(
      (a, b) => safeDateValue(parseDate(a.scheduledAt)) - safeDateValue(parseDate(b.scheduledAt))
    );
    container.innerHTML = `<div class="simple-list">${list
      .map((v) => {
        const result = resultMap[v.result] || resultMap.scheduled;
        const candidate = findCandidate(v.candidateId);
        const statusClass = candidate ? `status-${candidate.status}` : "status-withdrawn";
        const statusLabel = candidate ? labelForStatus(candidate.status) : "削除済み";
        return `
          <div class="list-item">
            <div>
              <p class="list-title">${escapeHtml(candidateName(v.candidateId))} / ${escapeHtml(v.type || "面接")}</p>
              <div class="list-meta">
                ${formatDateTime(v.scheduledAt)} ・ 面接官: ${escapeHtml(getInterviewersLabel(v))} ・ 場所: ${escapeHtml(getInterviewLocationLabel(v))}
                ${
                  v.meetingUrl
                    ? ` ・ <a href="${escapeHtml(v.meetingUrl)}" target="_blank" rel="noopener noreferrer">URL</a>`
                    : ""
                }
              </div>
              ${v.notes ? `<div class="list-meta">メモ: ${escapeHtml(truncate(v.notes))}</div>` : ""}
            </div>
            <div class="list-actions">
              <span class="badge ${statusClass}">${escapeHtml(statusLabel)}</span>
              <span class="badge ${result.className}">${result.label}</span>
              <button class="btn btn-soft btn-sm" type="button" onclick="App.openInterviewModal('${v.candidateId}','${v.id}')">編集</button>
              <button class="btn btn-danger btn-sm" type="button" onclick="App.deleteInterview('${v.id}')">削除</button>
            </div>
          </div>`;
      })
      .join("")}</div>`;
  }

  function renderEvaluations() {
    const container = document.getElementById("evaluations-list");
    if (!container) return;
    if (!state.evaluations.length) {
      container.innerHTML = emptyHtml("評価はまだ登録されていません。");
      return;
    }
    const list = [...state.evaluations].sort(
      (a, b) => safeDateValue(parseDate(b.updatedAt)) - safeDateValue(parseDate(a.updatedAt))
    );
    container.innerHTML = `<div class="simple-list">${list
      .map(
        (v) => {
          const candidate = findCandidate(v.candidateId);
          const linkedInterview = findInterview(v.interviewId);
          const statusClass = candidate ? `status-${candidate.status}` : "status-withdrawn";
          const statusLabel = candidate ? labelForStatus(candidate.status) : "削除済み";
          const evaluator1Done = isEvaluationSubmitted(v.evaluator1SubmittedAt);
          const evaluator2Done = isEvaluationSubmitted(v.evaluator2SubmittedAt);
          const finalized = hasFinalEvaluation(v) && Number.isFinite(Number(v.total));
          const totalLabel = finalized ? `${Number(v.total).toFixed(1)} / 50` : "未確定（2名入力待ち）";
          const diffItems = EVALUATION_SCORE_ITEMS
            .map((item) => {
              const s1 = clampScore(v.evaluator1Scores?.[item.key]);
              const s2 = clampScore(v.evaluator2Scores?.[item.key]);
              const diff = s1 - s2;
              return { label: item.label, diff };
            })
            .filter((item) => Math.abs(item.diff) >= 2)
            .slice(0, 3);
          return `
        <div class="list-item">
          <div>
            <p class="list-title">${escapeHtml(candidateName(v.candidateId))} / 最終評価 ${escapeHtml(totalLabel)}</p>
            <div class="list-meta">
              ${escapeHtml(v.evaluator1Name)}: ${
                evaluator1Done
                  ? `${Number(v.evaluator1Total || 0).toFixed(1)} / 50（平均 ${(Number(v.evaluator1Total || 0) / 10).toFixed(1)} / 5）`
                  : "未入力"
              }
            </div>
            <div class="list-meta">
              ${escapeHtml(v.evaluator2Name)}: ${
                evaluator2Done
                  ? `${Number(v.evaluator2Total || 0).toFixed(1)} / 50（平均 ${(Number(v.evaluator2Total || 0) / 10).toFixed(1)} / 5）`
                  : "未入力"
              }
            </div>
            ${
              linkedInterview
                ? `<div class="list-meta">対象面接: ${escapeHtml(linkedInterview.type)} / ${formatDateTime(linkedInterview.scheduledAt)}</div>`
                : ""
            }
            <div class="list-meta">入力状況: 担当1 ${evaluator1Done ? "入力済" : "未入力"} / 担当2 ${evaluator2Done ? "入力済" : "未入力"}</div>
            ${
              finalized && diffItems.length
                ? `<div class="list-meta">評価差分（±2以上）: ${diffItems
                    .map((item) => `${item.label} ${item.diff > 0 ? `+${item.diff}` : item.diff}`)
                    .join(" / ")}</div>`
                : ""
            }
            ${
              v.dangerFlags?.conditionsFocus || v.dangerFlags?.healthConcern
                ? `<div class="list-meta">危険兆候: ${[
                    v.dangerFlags?.conditionsFocus ? "条件面中心" : "",
                    v.dangerFlags?.healthConcern ? "疾患/障害懸念" : ""
                  ]
                    .filter(Boolean)
                    .join(" / ")}</div>`
                : ""
            }
            ${v.evaluator1Comment ? `<div class="list-meta">担当1メモ: ${escapeHtml(truncate(v.evaluator1Comment))}</div>` : ""}
            ${v.evaluator2Comment ? `<div class="list-meta">担当2メモ: ${escapeHtml(truncate(v.evaluator2Comment))}</div>` : ""}
            ${v.comment ? `<div class="list-meta">総合コメント: ${escapeHtml(truncate(v.comment))}</div>` : ""}
          </div>
          <div class="list-actions">
            <span class="badge ${statusClass}">${escapeHtml(statusLabel)}</span>
            <button class="btn btn-soft btn-sm" type="button" onclick="App.openEvaluationModal('${v.candidateId}','${v.id}')">編集</button>
            <button class="btn btn-danger btn-sm" type="button" onclick="App.deleteEvaluation('${v.id}')">削除</button>
          </div>
        </div>`;
        }
      )
      .join("")}</div>`;
  }

  function renderAnalytics() {
    const m = metricData();
    const put = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = String(text);
    };
    put("ana-total-candidates", m.totalCandidates);
    put("ana-interview-rate", percent(m.interviewRate));
    put("ana-offer-rate", percent(m.offerRate));
    put("ana-evaluation-average", m.evalAvg === null ? "-" : `${m.evalAvg.toFixed(1)} / 50`);

    const monthlyEl = document.getElementById("monthly-chart");
    if (monthlyEl) {
      const max = Math.max(...m.monthlyHires.map((v) => v.count), 1);
      monthlyEl.innerHTML = m.monthlyHires
        .map((v) => {
          const width = Math.round((v.count / max) * 100);
          return `<div class="bar-item"><span>${escapeHtml(v.label)}</span><div class="bar-track"><div class="bar-fill" style="width:${width}%"></div></div><strong>${v.count}</strong></div>`;
        })
        .join("");
    }

    const statusEl = document.getElementById("status-chart");
    if (statusEl) {
      const max = Math.max(...m.statusCounts.map((v) => v.count), 1);
      statusEl.innerHTML = m.statusCounts
        .map((v) => {
          const width = Math.round((v.count / max) * 100);
          return `<div class="status-row"><span>${escapeHtml(v.label)}</span><div class="status-track"><div class="status-fill" style="width:${width}%"></div></div><strong>${v.count}</strong></div>`;
        })
        .join("");
    }

    const tableEl = document.getElementById("source-table-body");
    if (tableEl) {
      tableEl.innerHTML = !m.sourceStats.length
        ? `<tr><td colspan="5">データがありません</td></tr>`
        : m.sourceStats
            .map((v) => {
              const rate = v.applicants ? Math.round((v.hired / v.applicants) * 100) : 0;
              return `<tr><td>${escapeHtml(v.source)}</td><td>${v.applicants}</td><td>${v.offers}</td><td>${v.hired}</td><td>${rate}%</td></tr>`;
            })
            .join("");
    }
  }

  function renderSettingOptionEditor(settingKey) {
    const meta = SETTINGS_OPTION_META[settingKey];
    if (!meta) return;
    const listEl = document.getElementById(meta.listId);
    if (!listEl) return;
    const options = getSettingOptionList(settingKey, meta.fallback);
    listEl.innerHTML = options
      .map(
        (option) => `
          <span class="source-chip">
            ${escapeHtml(option)}
            <button type="button" onclick="App.removeSettingOption('${settingKey}','${encodeURIComponent(option)}')" aria-label="${escapeHtml(option)}を削除">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </span>
        `
      )
      .join("");
  }

  function renderAllSettingOptionEditors() {
    Object.keys(SETTINGS_OPTION_META).forEach((settingKey) => renderSettingOptionEditor(settingKey));
  }

  function addSettingOption(settingKey, value) {
    const meta = SETTINGS_OPTION_META[settingKey];
    if (!meta) return;
    const label = String(value || "").trim();
    if (!label) {
      showToast(`${meta.label}名を入力してください。`);
      return;
    }
    const options = getSettingOptionList(settingKey, meta.fallback);
    if (options.includes(label)) {
      showToast(`同じ${meta.label}がすでにあります。`);
      return;
    }
    state.settings[settingKey] = [...options, label];
    saveState();
    renderSettingOptionEditor(settingKey);
    showToast(`${meta.label}を追加しました。`);
  }

  function addSettingOptionFromInput(settingKey) {
    const meta = SETTINGS_OPTION_META[settingKey];
    if (!meta) return;
    const input = document.getElementById(meta.inputId);
    if (!input) return;
    addSettingOption(settingKey, input.value);
    input.value = "";
  }

  function removeSettingOption(settingKey, value) {
    const meta = SETTINGS_OPTION_META[settingKey];
    if (!meta) return;
    let option = String(value || "").trim();
    try {
      option = decodeURIComponent(option);
    } catch (_error) {
      option = String(value || "").trim();
    }
    const options = getSettingOptionList(settingKey, meta.fallback);
    if (!options.includes(option)) return;
    if (options.length <= 1) {
      showToast(`${meta.label}は最低1件必要です。`);
      return;
    }
    state.settings[settingKey] = options.filter((v) => v !== option);
    saveState();
    renderSettingOptionEditor(settingKey);
    showToast(`${meta.label}を削除しました。`);
  }

  function addSourceOptionFromInput() {
    addSettingOptionFromInput("sourceOptions");
  }

  function removeSourceOption(value) {
    removeSettingOption("sourceOptions", value);
  }

  function renderSettings() {
    const form = document.getElementById("settings-form");
    const company = document.getElementById("settings-company-name");
    const target = document.getElementById("settings-monthly-target");
    const reminder = document.getElementById("settings-reminder-days");
    const summary = document.getElementById("settings-data-summary");

    if (company) company.value = state.settings.companyName || "";
    if (target) target.value = String(state.settings.monthlyTarget || 3);
    if (reminder) reminder.value = String(state.settings.reminderDays || 5);

    if (summary) {
      const last = [
        ...state.candidates.map((v) => v.updatedAt),
        ...state.interviews.map((v) => v.updatedAt),
        ...state.evaluations.map((v) => v.updatedAt)
      ]
        .map(parseDate)
        .filter(Boolean)
        .sort((a, b) => b.getTime() - a.getTime())[0];
      summary.textContent = `候補者 ${state.candidates.length}件 / 面接 ${state.interviews.length}件 / 評価 ${state.evaluations.length}件 / 採用ソース ${getSourceOptions().length}件 / 職種 ${getJobOptions().length}件 / 雇用形態 ${getEmploymentOptions().length}件 / 応募支店 ${getBranchOptions().length}件 / 最終更新: ${
        last ? formatDateTime(last.toISOString()) : "-"
      }`;
    }
    renderAllSettingOptionEditors();

    if (form && form.dataset.bound !== "1") {
      form.dataset.bound = "1";
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        state.settings.companyName = String(company?.value || "").trim();
        state.settings.monthlyTarget = Math.max(1, Number(target?.value) || 3);
        state.settings.reminderDays = Math.max(1, Number(reminder?.value) || 5);
        state.settings.sourceOptions = getSourceOptions();
        state.settings.jobOptions = getJobOptions();
        state.settings.employmentOptions = getEmploymentOptions();
        state.settings.branchOptions = getBranchOptions();
        saveState();
        renderSettings();
        showToast("設定を保存しました。");
      });
    }

    Object.entries(SETTINGS_OPTION_META).forEach(([settingKey, meta]) => {
      const input = document.getElementById(meta.inputId);
      if (!input || input.dataset.bound === "1") return;
      input.dataset.bound = "1";
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          addSettingOptionFromInput(settingKey);
        }
      });
    });
  }

  function renderPage() {
    const page = getPage();
    if (page === "home") return renderHome();
    if (page === "candidates") return renderCandidates();
    if (page === "interviews") return renderInterviews();
    if (page === "evaluation") return renderEvaluations();
    if (page === "analytics") return renderAnalytics();
    if (page === "settings") return renderSettings();
  }

  function openCandidateModal(candidateId) {
    const current = candidateId ? findCandidate(candidateId) : null;
    const sourceList = getSourceOptions();
    if (current?.source && !sourceList.includes(current.source)) {
      sourceList.push(current.source);
    }
    const jobList = getJobOptions();
    if (current?.jobCategory && !jobList.includes(current.jobCategory)) {
      jobList.push(current.jobCategory);
    }
    const employmentList = getEmploymentOptions();
    if (current?.employmentType && !employmentList.includes(current.employmentType)) {
      employmentList.push(current.employmentType);
    }
    const branchList = getBranchOptions();
    if (current?.appliedBranch && !branchList.includes(current.appliedBranch)) {
      branchList.push(current.appliedBranch);
    }
    const sourceOptions = sourceList.map((v) => {
      const selected = current?.source === v ? "selected" : "";
      return `<option value="${escapeHtml(v)}" ${selected}>${escapeHtml(v)}</option>`;
    }).join("");
    const jobOptions = jobList.map((v) => {
      const selected = current?.jobCategory === v ? "selected" : "";
      return `<option value="${escapeHtml(v)}" ${selected}>${escapeHtml(v)}</option>`;
    }).join("");
    const employmentOptions = employmentList.map((v) => {
      const selected = current?.employmentType === v ? "selected" : "";
      return `<option value="${escapeHtml(v)}" ${selected}>${escapeHtml(v)}</option>`;
    }).join("");
    const branchOptions = branchList.map((v) => {
      const selected = current?.appliedBranch === v ? "selected" : "";
      return `<option value="${escapeHtml(v)}" ${selected}>${escapeHtml(v)}</option>`;
    }).join("");
    const statusOptions = STATUS_OPTIONS.map((v) => {
      const selected = (current?.status || "applied") === v.value ? "selected" : "";
      return `<option value="${v.value}" ${selected}>${escapeHtml(v.label)}</option>`;
    }).join("");
    const priorityOptions = PRIORITY_OPTIONS.map((v) => {
      const selected = (current?.priority || "medium") === v.value ? "selected" : "";
      return `<option value="${v.value}" ${selected}>${escapeHtml(v.label)}</option>`;
    }).join("");

    openModal({
      title: current ? "候補者を編集" : "候補者を追加",
      submitText: current ? "更新する" : "追加する",
      body: `
        <div class="form-grid">
          <label class="form-row"><span class="form-label">氏名 *</span><input class="form-input" name="name" required value="${escapeHtml(current?.name || "")}"></label>
          <label class="form-row"><span class="form-label">フリガナ</span><input class="form-input" name="kana" value="${escapeHtml(current?.kana || "")}"></label>
          <label class="form-row"><span class="form-label">電話番号</span><input class="form-input" name="phone" value="${escapeHtml(current?.phone || "")}"></label>
          <label class="form-row"><span class="form-label">メール</span><input class="form-input" type="email" name="email" value="${escapeHtml(current?.email || "")}"></label>
          <label class="form-row"><span class="form-label">採用ソース</span><select class="form-select" name="source"><option value="">未設定</option>${sourceOptions}</select></label>
          <label class="form-row"><span class="form-label">職種</span><select class="form-select" name="jobCategory"><option value="">未設定</option>${jobOptions}</select></label>
          <label class="form-row"><span class="form-label">雇用形態</span><select class="form-select" name="employmentType"><option value="">未設定</option>${employmentOptions}</select></label>
          <label class="form-row"><span class="form-label">応募支店</span><select class="form-select" name="appliedBranch"><option value="">未設定</option>${branchOptions}</select></label>
          <label class="form-row"><span class="form-label">ステータス</span><select class="form-select" name="status">${statusOptions}</select></label>
          <label class="form-row"><span class="form-label">優先度</span><select class="form-select" name="priority">${priorityOptions}</select></label>
          <label class="form-row"><span class="form-label">応募日</span><input class="form-input" type="date" name="appliedAt" value="${toDateInputValue(current?.appliedAt)}"></label>
          <label class="form-row full"><span class="form-label">採用日</span><input class="form-input" type="date" name="hiredAt" value="${toDateInputValue(current?.hiredAt)}"></label>
          <label class="form-row full"><span class="form-label">備考</span><textarea class="form-textarea" name="notes">${escapeHtml(current?.notes || "")}</textarea></label>
        </div>
      `,
      onSubmit: (formData) => {
        const name = String(formData.get("name") || "").trim();
        if (!name) {
          showToast("氏名は必須です。");
          return;
        }
        const statusValue = STATUS_SET.has(formData.get("status")) ? String(formData.get("status")) : "applied";
        const next = current || { id: uid("cand"), createdAt: nowIso() };
        next.name = name;
        next.kana = String(formData.get("kana") || "").trim();
        next.phone = String(formData.get("phone") || "").trim();
        next.email = String(formData.get("email") || "").trim();
        next.source = String(formData.get("source") || "").trim();
        next.jobCategory = String(formData.get("jobCategory") || "").trim();
        next.employmentType = String(formData.get("employmentType") || "").trim();
        next.appliedBranch = String(formData.get("appliedBranch") || "").trim();
        next.priority = PRIORITY_SET.has(formData.get("priority")) ? formData.get("priority") : "medium";
        next.appliedAt = String(formData.get("appliedAt") || "");
        next.hiredAt = String(formData.get("hiredAt") || "");
        next.notes = String(formData.get("notes") || "").trim();
        setCandidateStatus(next, statusValue);
        if (!current) state.candidates.push(next);
        saveState();
        closeModal();
        renderPage();
        showToast(current ? "候補者を更新しました。" : "候補者を追加しました。");
      }
    });
  }

  function deleteCandidate(candidateId) {
    const candidate = findCandidate(candidateId);
    if (!candidate) return;
    if (!window.confirm(`${candidate.name} を削除しますか？関連データも削除されます。`)) return;
    state.candidates = state.candidates.filter((v) => v.id !== candidateId);
    state.interviews = state.interviews.filter((v) => v.candidateId !== candidateId);
    state.evaluations = state.evaluations.filter((v) => v.candidateId !== candidateId);
    saveState();
    renderPage();
    showToast("候補者を削除しました。");
  }

  function openInterviewModal(prefilledCandidateId = "", interviewId = "") {
    if (!state.candidates.length) {
      showToast("先に候補者を追加してください。");
      openCandidateModal();
      return;
    }
    const current = interviewId ? state.interviews.find((v) => v.id === interviewId) : null;
    const defaultCandidateId = current?.candidateId || prefilledCandidateId || state.candidates[0].id;
    const candidateOptions = [...state.candidates]
      .sort((a, b) => a.name.localeCompare(b.name, "ja"))
      .map((v) => `<option value="${v.id}" ${v.id === defaultCandidateId ? "selected" : ""}>${escapeHtml(v.name)}</option>`)
      .join("");
    const resultOptions = [
      { value: "scheduled", label: "予定" },
      { value: "pass", label: "通過" },
      { value: "fail", label: "見送り" },
      { value: "hold", label: "保留" }
    ]
      .map((v) => `<option value="${v.value}" ${(current?.result || "scheduled") === v.value ? "selected" : ""}>${v.label}</option>`)
      .join("");
    const typeOptions = ["一次", "二次", "最終", "カジュアル面談"]
      .map((v) => `<option value="${escapeHtml(v)}" ${(current?.type || "一次") === v ? "selected" : ""}>${escapeHtml(v)}</option>`)
      .join("");
    const currentLocationType = INTERVIEW_LOCATION_SET.has(current?.locationType)
      ? current.locationType
      : inferInterviewLocationType(current?.location, current?.meetingUrl);
    const locationTypeOptions = INTERVIEW_LOCATION_OPTIONS.map(
      (option) =>
        `<option value="${option.value}" ${currentLocationType === option.value ? "selected" : ""}>${escapeHtml(option.label)}</option>`
    ).join("");
    const statusLinkOptions = [
      `<option value="auto">面接結果に連動（自動）</option>`,
      ...STATUS_OPTIONS.map((v) => `<option value="${v.value}">候補者ステータスを「${escapeHtml(v.label)}」へ変更</option>`)
    ].join("");
    const currentMeetingUrl = String(current?.meetingUrl || extractUrlFromText(current?.location) || "").trim();
    const currentCustomLocation = String(current?.customLocation || "").trim();
    const currentInterviewerPrimary = String(current?.interviewerPrimary || current?.interviewer || "").trim();
    const currentInterviewerSecondary = String(current?.interviewerSecondary || "").trim();

    openModal({
      title: current ? "面接を編集" : "面接を追加",
      submitText: current ? "更新する" : "追加する",
      body: `
        <div class="form-grid">
          <label class="form-row"><span class="form-label">候補者 *</span><select class="form-select" name="candidateId" required>${candidateOptions}</select></label>
          <label class="form-row"><span class="form-label">日時 *</span><input class="form-input" type="datetime-local" name="scheduledAt" required value="${toDatetimeLocalValue(current?.scheduledAt || nowIso())}"></label>
          <label class="form-row"><span class="form-label">区分</span><select class="form-select" name="type">${typeOptions}</select></label>
          <label class="form-row"><span class="form-label">結果</span><select class="form-select" name="result">${resultOptions}</select></label>
          <label class="form-row"><span class="form-label">面接担当1 *</span><input class="form-input" name="interviewerPrimary" required value="${escapeHtml(currentInterviewerPrimary)}"></label>
          <label class="form-row"><span class="form-label">面接担当2（任意）</span><input class="form-input" name="interviewerSecondary" value="${escapeHtml(currentInterviewerSecondary)}"></label>
          <label class="form-row"><span class="form-label">面接場所 *</span><select class="form-select" name="locationType" id="interview-location-type">${locationTypeOptions}</select></label>
          <label class="form-row" id="interview-custom-location-row"><span class="form-label">その他の場所詳細</span><input class="form-input" name="customLocation" id="interview-custom-location-input" value="${escapeHtml(currentCustomLocation)}"></label>
          <label class="form-row full" id="interview-meeting-url-row"><span class="form-label">オンライン面接URL *</span><input class="form-input" type="url" name="meetingUrl" id="interview-meeting-url-input" value="${escapeHtml(currentMeetingUrl)}" placeholder="https://..."></label>
          <label class="form-row full"><span class="form-label">候補者ステータス連動</span><select class="form-select" name="candidateStatusLink">${statusLinkOptions}</select></label>
          <label class="form-row full"><span class="form-label">メモ</span><textarea class="form-textarea" name="notes">${escapeHtml(current?.notes || "")}</textarea></label>
        </div>
      `,
      onSubmit: (formData) => {
        const candidateId = String(formData.get("candidateId") || "");
        const scheduledAt = fromDatetimeLocalValue(String(formData.get("scheduledAt") || ""));
        const candidateStatusLink = String(formData.get("candidateStatusLink") || "auto");
        const interviewerPrimary = String(formData.get("interviewerPrimary") || "").trim();
        const interviewerSecondary = String(formData.get("interviewerSecondary") || "").trim();
        const locationType = INTERVIEW_LOCATION_SET.has(formData.get("locationType")) ? String(formData.get("locationType")) : "naniwa";
        const customLocation = String(formData.get("customLocation") || "").trim();
        const meetingUrl = String(formData.get("meetingUrl") || "").trim();
        if (!candidateId || !scheduledAt) {
          showToast("候補者と日時は必須です。");
          return;
        }
        if (!interviewerPrimary) {
          showToast("面接担当1を入力してください。");
          return;
        }
        if (locationType === "other" && !customLocation) {
          showToast("「その他」の場合は場所詳細を入力してください。");
          return;
        }
        if (isMeetingUrlRequired(locationType) && !isValidHttpUrl(meetingUrl)) {
          showToast("リモート/その他では有効なURL（http/https）が必須です。");
          return;
        }
        const next = current || { id: uid("int"), createdAt: nowIso() };
        next.candidateId = candidateId;
        next.scheduledAt = scheduledAt;
        next.type = String(formData.get("type") || "一次");
        next.result = String(formData.get("result") || "scheduled");
        next.interviewerPrimary = interviewerPrimary;
        next.interviewerSecondary = interviewerSecondary;
        next.locationType = locationType;
        next.customLocation = locationType === "other" ? customLocation : "";
        next.meetingUrl = isMeetingUrlRequired(locationType) ? meetingUrl : "";
        next.interviewer = getInterviewersLabel(next);
        next.location = getInterviewLocationLabel(next);
        next.notes = String(formData.get("notes") || "").trim();
        next.updatedAt = nowIso();
        if (!current) state.interviews.push(next);

        const candidate = findCandidate(candidateId);
        if (candidate) {
          if (candidateStatusLink !== "auto" && STATUS_SET.has(candidateStatusLink)) {
            setCandidateStatus(candidate, candidateStatusLink);
          } else {
            applyInterviewResultStatus(candidate, next.result, next.type);
          }
        }

        saveState();
        closeModal();
        renderPage();
        showToast(current ? "面接を更新しました。" : "面接を追加しました。");
      }
    });

    const locationTypeElement = document.getElementById("interview-location-type");
    const customLocationRow = document.getElementById("interview-custom-location-row");
    const customLocationInput = document.getElementById("interview-custom-location-input");
    const meetingUrlRow = document.getElementById("interview-meeting-url-row");
    const meetingUrlInput = document.getElementById("interview-meeting-url-input");
    const syncInterviewLocationFields = () => {
      const type = String(locationTypeElement?.value || "naniwa");
      const showOther = type === "other";
      const showUrl = isMeetingUrlRequired(type);
      if (customLocationRow) customLocationRow.style.display = showOther ? "grid" : "none";
      if (customLocationInput) customLocationInput.required = showOther;
      if (meetingUrlRow) meetingUrlRow.style.display = showUrl ? "grid" : "none";
      if (meetingUrlInput) meetingUrlInput.required = showUrl;
    };
    locationTypeElement?.addEventListener("change", syncInterviewLocationFields);
    syncInterviewLocationFields();
  }

  function deleteInterview(interviewId) {
    if (!window.confirm("この面接データを削除しますか？")) return;
    state.interviews = state.interviews.filter((v) => v.id !== interviewId);
    saveState();
    renderPage();
    showToast("面接データを削除しました。");
  }

  function openEvaluationModal(prefilledCandidateId = "", evaluationId = "") {
    if (!state.candidates.length) {
      showToast("先に候補者を追加してください。");
      openCandidateModal();
      return;
    }
    const current = evaluationId ? state.evaluations.find((v) => v.id === evaluationId) : null;
    const defaultCandidateId = current?.candidateId || prefilledCandidateId || state.candidates[0].id;
    const candidateOptions = [...state.candidates]
      .sort((a, b) => a.name.localeCompare(b.name, "ja"))
      .map((v) => `<option value="${v.id}" ${v.id === defaultCandidateId ? "selected" : ""}>${escapeHtml(v.name)}</option>`)
      .join("");
    const interviewsSorted = [...state.interviews].sort(
      (a, b) => safeDateValue(parseDate(b.scheduledAt)) - safeDateValue(parseDate(a.scheduledAt))
    );
    const defaultInterview =
      (current?.interviewId && findInterview(current.interviewId)) ||
      interviewsSorted.find((interview) => interview.candidateId === defaultCandidateId) ||
      null;
    const defaultInterviewId = defaultInterview?.id || "";
    const defaultEvaluator1Name = String(
      current?.evaluator1Name || defaultInterview?.interviewerPrimary || defaultInterview?.interviewer || "面接担当1"
    ).trim();
    const defaultEvaluator2Name = String(
      current?.evaluator2Name || defaultInterview?.interviewerSecondary || "面接担当2"
    ).trim();
    const defaultEntryMode = current
      ? !isEvaluationSubmitted(current.evaluator1SubmittedAt) && isEvaluationSubmitted(current.evaluator2SubmittedAt)
        ? "evaluator1"
        : isEvaluationSubmitted(current.evaluator1SubmittedAt) && !isEvaluationSubmitted(current.evaluator2SubmittedAt)
          ? "evaluator2"
          : "evaluator1"
      : "evaluator1";
    const statusLinkOptions = [
      `<option value="keep">変更しない</option>`,
      ...STATUS_OPTIONS.map((v) => `<option value="${v.value}">候補者ステータスを「${escapeHtml(v.label)}」へ変更</option>`)
    ].join("");
    const evaluator1Scores = current?.evaluator1Scores || buildDefaultScoreMap(3);
    const evaluator2Scores = current?.evaluator2Scores || buildDefaultScoreMap(3);
    const initialEvaluator1Total = Number(current?.evaluator1Total || calcScoreSheetTotal(evaluator1Scores));
    const initialEvaluator2Total = Number(current?.evaluator2Total || calcScoreSheetTotal(evaluator2Scores));
    const initialFinalTotal = Number(current?.total || calcFinalEvaluationAverage(initialEvaluator1Total, initialEvaluator2Total));
    const questionRows = HEARING_QUESTIONS.map(
      (question) => `
        <label class="form-row full">
          <span class="form-label">${escapeHtml(question.label)}</span>
          <textarea class="form-textarea" name="qa_${question.key}">${escapeHtml(current?.questionAnswers?.[question.key] || "")}</textarea>
        </label>
      `
    ).join("");
    const evaluator1ScoreRows = EVALUATION_SCORE_ITEMS.map(
      (item) => `
        <label class="form-row">
          <span class="form-label">${escapeHtml(item.label)}<br><small>${escapeHtml(item.hint)}</small></span>
          <input class="form-input" type="number" min="1" max="5" required name="s1_${item.key}" value="${clampScore(evaluator1Scores[item.key])}">
        </label>
      `
    ).join("");
    const evaluator2ScoreRows = EVALUATION_SCORE_ITEMS.map(
      (item) => `
        <label class="form-row">
          <span class="form-label">${escapeHtml(item.label)}<br><small>${escapeHtml(item.hint)}</small></span>
          <input class="form-input" type="number" min="1" max="5" required name="s2_${item.key}" value="${clampScore(evaluator2Scores[item.key])}">
        </label>
      `
    ).join("");
    const overviewChecklistRows = COMPANY_OVERVIEW_KEYS.map(
      (item) => `
        <label class="check-row">
          <input type="checkbox" name="overview_${item.key}" ${current?.overviewChecklist?.[item.key] ? "checked" : ""}>
          <span>${escapeHtml(item.label)}</span>
        </label>
      `
    ).join("");
    const demeritChecklistRows = DEMERIT_CHECK_ITEMS.map(
      (item) => `
        <label class="check-row">
          <input type="checkbox" name="overview_${item.key}" ${current?.overviewChecklist?.[item.key] ? "checked" : ""}>
          <span>${escapeHtml(item.label)}</span>
        </label>
      `
    ).join("");
    const dangerFlagRows = DANGER_FLAG_KEYS.map(
      (item) => `
        <label class="check-row danger">
          <input type="checkbox" name="danger_${item.key}" ${current?.dangerFlags?.[item.key] ? "checked" : ""}>
          <span>${escapeHtml(item.label)}</span>
        </label>
      `
    ).join("");

    openModal({
      title: current ? "評価を編集" : "評価を追加",
      submitText: current ? "評価を保存" : "評価を保存",
      body: `
        <div class="form-grid">
          <label class="form-row full"><span class="form-label">候補者 *</span><select class="form-select" name="candidateId" required>${candidateOptions}</select></label>
          <label class="form-row full"><span class="form-label">対象面接 *</span><select class="form-select" name="interviewId" id="evaluation-interview-id"></select></label>
          <label class="form-row">
            <span class="form-label">今回の記入者 *</span>
            <select class="form-select" name="entryMode" id="evaluation-entry-mode">
              <option value="evaluator1" ${defaultEntryMode === "evaluator1" ? "selected" : ""}>担当1として記入</option>
              <option value="evaluator2" ${defaultEntryMode === "evaluator2" ? "selected" : ""}>担当2として記入</option>
            </select>
          </label>
          <div class="form-row">
            <span class="form-label">入力状況</span>
            <div class="entry-status-row">
              <span class="entry-status-chip" id="evaluation-status-1">担当1: 未入力</span>
              <span class="entry-status-chip" id="evaluation-status-2">担当2: 未入力</span>
              <span class="entry-status-chip final" id="evaluation-status-final">最終: 未確定</span>
            </div>
          </div>

          <label class="form-row"><span class="form-label">面接担当1 *</span><input class="form-input" id="evaluation-evaluator1-name" name="evaluator1Name" required value="${escapeHtml(defaultEvaluator1Name)}"></label>
          <label class="form-row"><span class="form-label">面接担当2 *</span><input class="form-input" id="evaluation-evaluator2-name" name="evaluator2Name" required value="${escapeHtml(defaultEvaluator2Name)}"></label>
        </div>

        <div class="sheet-section">
          <h3 class="sheet-title">1. ヒアリングシート（質問）</h3>
          <label class="form-row full">
            <span class="form-label">記入者氏名</span>
            <input class="form-input" id="evaluation-question-recorder" readonly value="${escapeHtml(
              defaultEntryMode === "evaluator2" ? defaultEvaluator2Name : defaultEvaluator1Name
            )}">
          </label>
          <div class="form-grid">${questionRows}</div>
        </div>

        <div class="sheet-section">
          <h3 class="sheet-title">2. 会社概要説明（説明済みチェック）</h3>
          <div class="check-list">${overviewChecklistRows}</div>
          <div class="sheet-note">【必ず伝えるデメリット】</div>
          <div class="check-list">${demeritChecklistRows}</div>
        </div>

        <div class="sheet-section">
          <h3 class="sheet-title">3. 評価シート（1〜5点）</h3>
          <div class="sheet-note">採点基準: 1＝かなり懸念あり / 2＝やや懸念あり / 3＝標準 / 4＝良好 / 5＝非常に良い</div>
          <div class="live-score-board">
            <div class="live-score-item">
              <span>担当1合計</span>
              <strong id="evaluation-total-1">${Number(initialEvaluator1Total).toFixed(1)} / 50</strong>
            </div>
            <div class="live-score-item">
              <span>担当2合計</span>
              <strong id="evaluation-total-2">${Number(initialEvaluator2Total).toFixed(1)} / 50</strong>
            </div>
            <div class="live-score-item final">
              <span>最終評価（2名平均）</span>
              <strong id="evaluation-total-final">${Number(initialFinalTotal).toFixed(1)} / 50</strong>
            </div>
          </div>
          <div class="score-sheet-grid">
            <fieldset class="score-sheet-col" id="evaluation-fieldset-1">
              <h4>担当1 評価</h4>
              ${evaluator1ScoreRows}
              <label class="form-row full"><span class="form-label">担当1メモ</span><textarea class="form-textarea" name="evaluator1Comment">${escapeHtml(current?.evaluator1Comment || "")}</textarea></label>
            </fieldset>
            <fieldset class="score-sheet-col" id="evaluation-fieldset-2">
              <h4>担当2 評価</h4>
              ${evaluator2ScoreRows}
              <label class="form-row full"><span class="form-label">担当2メモ</span><textarea class="form-textarea" name="evaluator2Comment">${escapeHtml(current?.evaluator2Comment || "")}</textarea></label>
            </fieldset>
          </div>
        </div>

        <div class="sheet-section">
          <h3 class="sheet-title">4. 2名評価比較</h3>
          <div class="table-wrap compare-wrap">
            <table class="data-table compare-table">
              <thead>
                <tr>
                  <th>評価項目</th>
                  <th>担当1</th>
                  <th>担当2</th>
                  <th>差分(1-2)</th>
                  <th>平均</th>
                </tr>
              </thead>
              <tbody id="evaluation-compare-body"></tbody>
            </table>
          </div>
        </div>

        <div class="form-grid">
          <label class="form-row full"><span class="form-label">最後に質問：「ここまで聞いて不安な点はどこですか？」</span><textarea class="form-textarea" name="anxietyPoint">${escapeHtml(current?.anxietyPoint || "")}</textarea></label>
          <label class="form-row full"><span class="form-label">最後に質問：「想像と違った部分はありましたか？」</span><textarea class="form-textarea" name="gapPoint">${escapeHtml(current?.gapPoint || "")}</textarea></label>
        </div>
        <div class="check-list">
          <label class="check-row">
            <input type="checkbox" name="pamphletShared" ${current?.pamphletShared ? "checked" : ""}>
            <span>待遇面が記載されたパンフレットを渡した</span>
          </label>
          <label class="check-row">
            <input type="checkbox" name="interviewClosed" ${current?.interviewClosed ? "checked" : ""}>
            <span>質問がないことを確認し、面接を終了した</span>
          </label>
        </div>

        <div class="sheet-section">
          <h3 class="sheet-title">5. 危険兆候チェック</h3>
          <div class="check-list">${dangerFlagRows}</div>
        </div>

        <div class="form-grid">
          <label class="form-row full"><span class="form-label">候補者ステータス連動</span><select class="form-select" name="candidateStatusLink">${statusLinkOptions}</select></label>
          <label class="form-row full"><span class="form-label">コメント</span><textarea class="form-textarea" name="comment">${escapeHtml(current?.comment || "")}</textarea></label>
        </div>
      `,
      onSubmit: (formData) => {
        const candidateId = String(formData.get("candidateId") || "");
        const interviewId = String(formData.get("interviewId") || "");
        const entryModeRaw = String(formData.get("entryMode") || "evaluator1");
        const entryMode = entryModeRaw === "evaluator2" ? "evaluator2" : "evaluator1";
        const candidateStatusLink = String(formData.get("candidateStatusLink") || "keep");
        if (!candidateId) {
          showToast("候補者を選択してください。");
          return;
        }
        if (!interviewId) {
          showToast("対象面接を選択してください。");
          return;
        }

        const evaluator1Name = String(formData.get("evaluator1Name") || "").trim();
        const evaluator2Name = String(formData.get("evaluator2Name") || "").trim();
        if (!evaluator1Name || !evaluator2Name) {
          showToast("面接担当1・2の氏名を入力してください。");
          return;
        }

        let next = current;
        if (!next) {
          next = state.evaluations.find((item) => item.candidateId === candidateId && item.interviewId === interviewId) || null;
        }
        const isCreate = !next;
        if (!next) next = { id: uid("eva"), createdAt: nowIso() };

        next.candidateId = candidateId;
        next.interviewId = interviewId;
        next.evaluator1Name = evaluator1Name;
        next.evaluator2Name = evaluator2Name;

        const selectedScoreMap = buildDefaultScoreMap(3);
        EVALUATION_SCORE_ITEMS.forEach((item) => {
          const key = entryMode === "evaluator2" ? `s2_${item.key}` : `s1_${item.key}`;
          selectedScoreMap[item.key] = clampScore(formData.get(key));
        });
        const selectedTotal = calcScoreSheetTotal(selectedScoreMap);
        const now = nowIso();

        if (entryMode === "evaluator2") {
          next.evaluator2Scores = selectedScoreMap;
          next.evaluator2Total = selectedTotal;
          next.evaluator2SubmittedAt = now;
        } else {
          next.evaluator1Scores = selectedScoreMap;
          next.evaluator1Total = selectedTotal;
          next.evaluator1SubmittedAt = now;
        }
        if (!next.evaluator1Scores) next.evaluator1Scores = buildDefaultScoreMap(3);
        if (!next.evaluator2Scores) next.evaluator2Scores = buildDefaultScoreMap(3);
        if (!Number(next.evaluator1Total)) next.evaluator1Total = calcScoreSheetTotal(next.evaluator1Scores);
        if (!Number(next.evaluator2Total)) next.evaluator2Total = calcScoreSheetTotal(next.evaluator2Scores);
        next.total = calcFinalEvaluationTotal(next);

        next.questionRecorderName = entryMode === "evaluator2" ? evaluator2Name : evaluator1Name;
        next.questionAnswers = Object.fromEntries(
          HEARING_QUESTIONS.map((question) => [question.key, String(formData.get(`qa_${question.key}`) || "").trim()])
        );
        next.overviewChecklist = Object.fromEntries(
          [...COMPANY_OVERVIEW_KEYS, ...DEMERIT_CHECK_ITEMS].map((item) => [item.key, formData.has(`overview_${item.key}`)])
        );
        next.anxietyPoint = String(formData.get("anxietyPoint") || "").trim();
        next.gapPoint = String(formData.get("gapPoint") || "").trim();
        next.pamphletShared = formData.has("pamphletShared");
        next.interviewClosed = formData.has("interviewClosed");
        next.dangerFlags = Object.fromEntries(
          DANGER_FLAG_KEYS.map((item) => [item.key, formData.has(`danger_${item.key}`)])
        );
        const evaluator1CommentValue = formData.get("evaluator1Comment");
        const evaluator2CommentValue = formData.get("evaluator2Comment");
        next.evaluator1Comment =
          evaluator1CommentValue === null ? String(next.evaluator1Comment || "") : String(evaluator1CommentValue || "").trim();
        next.evaluator2Comment =
          evaluator2CommentValue === null ? String(next.evaluator2Comment || "") : String(evaluator2CommentValue || "").trim();
        next.comment = String(formData.get("comment") || "").trim();
        next.updatedAt = now;
        if (isCreate) state.evaluations.push(next);

        const candidate = findCandidate(candidateId);
        if (candidate) {
          if (candidateStatusLink !== "keep" && STATUS_SET.has(candidateStatusLink)) {
            setCandidateStatus(candidate, candidateStatusLink);
          } else {
            candidate.updatedAt = nowIso();
          }
        }
        saveState();
        closeModal();
        renderPage();
        if (hasFinalEvaluation(next)) {
          showToast(`${entryMode === "evaluator2" ? "担当2" : "担当1"}の評価を保存し、最終平均を更新しました。`);
        } else {
          showToast(`${entryMode === "evaluator2" ? "担当2" : "担当1"}の評価を保存しました。もう一方の入力で最終確定します。`);
        }
      }
    });

    const modalForm = document.getElementById("modal-form");
    const candidateElement = modalForm?.querySelector('select[name="candidateId"]');
    const interviewElement = document.getElementById("evaluation-interview-id");
    const entryModeElement = document.getElementById("evaluation-entry-mode");
    const evaluator1Element = document.getElementById("evaluation-evaluator1-name");
    const evaluator2Element = document.getElementById("evaluation-evaluator2-name");
    const recorderElement = document.getElementById("evaluation-question-recorder");
    const fieldset1 = document.getElementById("evaluation-fieldset-1");
    const fieldset2 = document.getElementById("evaluation-fieldset-2");
    const total1Element = document.getElementById("evaluation-total-1");
    const total2Element = document.getElementById("evaluation-total-2");
    const totalFinalElement = document.getElementById("evaluation-total-final");
    const status1Element = document.getElementById("evaluation-status-1");
    const status2Element = document.getElementById("evaluation-status-2");
    const statusFinalElement = document.getElementById("evaluation-status-final");
    const compareBodyElement = document.getElementById("evaluation-compare-body");
    const submitButton = modalForm?.querySelector('button[type="submit"]');

    const renderInterviewOptions = (candidateId, selectedInterviewId = "") => {
      if (!interviewElement) return;
      const interviews = interviewsSorted.filter((interview) => interview.candidateId === candidateId);
      if (!interviews.length) {
        interviewElement.innerHTML = `<option value="">対象面接なし</option>`;
        return;
      }
      interviewElement.innerHTML = interviews
        .map((interview) => {
          const selected = interview.id === selectedInterviewId ? "selected" : "";
          return `<option value="${interview.id}" ${selected}>${escapeHtml(interview.type)} / ${formatDateTime(interview.scheduledAt)} / ${escapeHtml(getInterviewLocationLabel(interview))}</option>`;
        })
        .join("");
    };

    const applyInterviewerNamesFromInterview = (forceUpdate = false) => {
      const selectedInterview = findInterview(interviewElement?.value || "");
      if (!selectedInterview) return;
      if (evaluator1Element && (forceUpdate || !evaluator1Element.value.trim())) {
        evaluator1Element.value = selectedInterview.interviewerPrimary || selectedInterview.interviewer || "面接担当1";
      }
      if (evaluator2Element && (forceUpdate || !evaluator2Element.value.trim())) {
        evaluator2Element.value = selectedInterview.interviewerSecondary || "面接担当2";
      }
    };
    const getActiveEvaluationRecord = () => {
      if (current && interviewElement?.value === current.interviewId && candidateElement?.value === current.candidateId) {
        return current;
      }
      return state.evaluations.find(
        (item) => item.candidateId === String(candidateElement?.value || "") && item.interviewId === String(interviewElement?.value || "")
      );
    };
    let appliedEvaluationId = current?.id || "";
    const applyEvaluationRecordToForm = (record) => {
      if (!record || !modalForm) return;
      if (evaluator1Element) evaluator1Element.value = record.evaluator1Name || evaluator1Element.value;
      if (evaluator2Element) evaluator2Element.value = record.evaluator2Name || evaluator2Element.value;
      HEARING_QUESTIONS.forEach((question) => {
        const el = modalForm.querySelector(`[name="qa_${question.key}"]`);
        if (el instanceof HTMLTextAreaElement) {
          el.value = String(record.questionAnswers?.[question.key] || "");
        }
      });
      [...COMPANY_OVERVIEW_KEYS, ...DEMERIT_CHECK_ITEMS].forEach((item) => {
        const checkbox = modalForm.querySelector(`[name="overview_${item.key}"]`);
        if (checkbox instanceof HTMLInputElement) {
          checkbox.checked = Boolean(record.overviewChecklist?.[item.key]);
        }
      });
      DANGER_FLAG_KEYS.forEach((item) => {
        const checkbox = modalForm.querySelector(`[name="danger_${item.key}"]`);
        if (checkbox instanceof HTMLInputElement) {
          checkbox.checked = Boolean(record.dangerFlags?.[item.key]);
        }
      });
      EVALUATION_SCORE_ITEMS.forEach((item) => {
        const s1 = modalForm.querySelector(`[name="s1_${item.key}"]`);
        const s2 = modalForm.querySelector(`[name="s2_${item.key}"]`);
        if (s1 instanceof HTMLInputElement) s1.value = String(clampScore(record.evaluator1Scores?.[item.key]));
        if (s2 instanceof HTMLInputElement) s2.value = String(clampScore(record.evaluator2Scores?.[item.key]));
      });
      const anxietyEl = modalForm.querySelector('[name="anxietyPoint"]');
      const gapEl = modalForm.querySelector('[name="gapPoint"]');
      const evaluator1CommentEl = modalForm.querySelector('[name="evaluator1Comment"]');
      const evaluator2CommentEl = modalForm.querySelector('[name="evaluator2Comment"]');
      const commentEl = modalForm.querySelector('[name="comment"]');
      const pamphletEl = modalForm.querySelector('[name="pamphletShared"]');
      const closedEl = modalForm.querySelector('[name="interviewClosed"]');
      if (anxietyEl instanceof HTMLTextAreaElement) anxietyEl.value = String(record.anxietyPoint || "");
      if (gapEl instanceof HTMLTextAreaElement) gapEl.value = String(record.gapPoint || "");
      if (evaluator1CommentEl instanceof HTMLTextAreaElement) evaluator1CommentEl.value = String(record.evaluator1Comment || "");
      if (evaluator2CommentEl instanceof HTMLTextAreaElement) evaluator2CommentEl.value = String(record.evaluator2Comment || "");
      if (commentEl instanceof HTMLTextAreaElement) commentEl.value = String(record.comment || "");
      if (pamphletEl instanceof HTMLInputElement) pamphletEl.checked = Boolean(record.pamphletShared);
      if (closedEl instanceof HTMLInputElement) closedEl.checked = Boolean(record.interviewClosed);
      if (entryModeElement) {
        const recommendedMode =
          !isEvaluationSubmitted(record.evaluator1SubmittedAt) && isEvaluationSubmitted(record.evaluator2SubmittedAt)
            ? "evaluator1"
            : isEvaluationSubmitted(record.evaluator1SubmittedAt) && !isEvaluationSubmitted(record.evaluator2SubmittedAt)
              ? "evaluator2"
              : String(entryModeElement.value || "evaluator1");
        entryModeElement.value = recommendedMode;
      }
      appliedEvaluationId = record.id;
    };
    const syncActiveEvaluationToForm = () => {
      const active = getActiveEvaluationRecord();
      if (!active) {
        appliedEvaluationId = "";
        return;
      }
      if (active.id === appliedEvaluationId) return;
      applyEvaluationRecordToForm(active);
      syncEntryMode();
      syncStatusIndicators();
      syncEvaluationScorePreview();
    };
    const syncEntryMode = () => {
      const mode = String(entryModeElement?.value || "evaluator1");
      if (fieldset1) {
        fieldset1.disabled = mode !== "evaluator1";
        fieldset1.classList.toggle("readonly-column", mode !== "evaluator1");
      }
      if (fieldset2) {
        fieldset2.disabled = mode !== "evaluator2";
        fieldset2.classList.toggle("readonly-column", mode !== "evaluator2");
      }
      if (recorderElement) {
        const recorderName = mode === "evaluator2" ? String(evaluator2Element?.value || "") : String(evaluator1Element?.value || "");
        recorderElement.value = recorderName;
      }
      if (submitButton) {
        submitButton.textContent = mode === "evaluator2" ? "担当2評価を保存" : "担当1評価を保存";
      }
    };
    const renderComparisonTable = () => {
      if (!compareBodyElement) return;
      compareBodyElement.innerHTML = EVALUATION_SCORE_ITEMS.map((item) => {
        const score1 = clampScore(modalForm?.querySelector(`[name="s1_${item.key}"]`)?.value);
        const score2 = clampScore(modalForm?.querySelector(`[name="s2_${item.key}"]`)?.value);
        const diff = score1 - score2;
        const avg = averageScoreForItem(score1, score2);
        return `<tr>
          <td>${escapeHtml(item.label)}</td>
          <td>${score1}</td>
          <td>${score2}</td>
          <td>${diff > 0 ? `+${diff}` : diff}</td>
          <td>${avg}</td>
        </tr>`;
      }).join("");
    };
    const syncStatusIndicators = () => {
      const active = getActiveEvaluationRecord();
      const done1 = isEvaluationSubmitted(active?.evaluator1SubmittedAt);
      const done2 = isEvaluationSubmitted(active?.evaluator2SubmittedAt);
      const doneFinal = hasFinalEvaluation(active || {});
      if (status1Element) status1Element.textContent = `担当1: ${done1 ? "入力済" : "未入力"}`;
      if (status2Element) status2Element.textContent = `担当2: ${done2 ? "入力済" : "未入力"}`;
      if (statusFinalElement) statusFinalElement.textContent = `最終: ${doneFinal ? "確定" : "未確定"}`;
    };
    const syncEvaluationScorePreview = () => {
      const score1 = buildDefaultScoreMap(3);
      const score2 = buildDefaultScoreMap(3);
      EVALUATION_SCORE_ITEMS.forEach((item) => {
        const evaluator1Value = modalForm?.querySelector(`[name="s1_${item.key}"]`)?.value;
        const evaluator2Value = modalForm?.querySelector(`[name="s2_${item.key}"]`)?.value;
        score1[item.key] = clampScore(evaluator1Value);
        score2[item.key] = clampScore(evaluator2Value);
      });
      const total1 = calcScoreSheetTotal(score1);
      const total2 = calcScoreSheetTotal(score2);
      const finalTotal = calcFinalEvaluationAverage(total1, total2);
      if (total1Element) total1Element.textContent = `${Number(total1).toFixed(1)} / 50`;
      if (total2Element) total2Element.textContent = `${Number(total2).toFixed(1)} / 50`;
      if (totalFinalElement) totalFinalElement.textContent = `${Number(finalTotal).toFixed(1)} / 50`;
      renderComparisonTable();
    };

    const initialCandidateId = String(candidateElement?.value || defaultCandidateId);
    renderInterviewOptions(initialCandidateId, current?.interviewId || defaultInterviewId);
    applyInterviewerNamesFromInterview(Boolean(current?.interviewId));
    syncActiveEvaluationToForm();
    syncEntryMode();
    syncStatusIndicators();

    candidateElement?.addEventListener("change", () => {
      renderInterviewOptions(String(candidateElement.value || ""), "");
      applyInterviewerNamesFromInterview(true);
      syncActiveEvaluationToForm();
      syncStatusIndicators();
    });
    interviewElement?.addEventListener("change", () => {
      applyInterviewerNamesFromInterview(true);
      syncActiveEvaluationToForm();
      syncStatusIndicators();
    });
    entryModeElement?.addEventListener("change", () => {
      syncEntryMode();
    });
    evaluator1Element?.addEventListener("input", () => {
      syncEntryMode();
    });
    evaluator2Element?.addEventListener("input", () => {
      syncEntryMode();
    });
    modalForm?.addEventListener("input", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;
      if (!target.name.startsWith("s1_") && !target.name.startsWith("s2_")) return;
      syncEvaluationScorePreview();
    });
    syncEvaluationScorePreview();
  }

  function deleteEvaluation(evaluationId) {
    if (!window.confirm("この評価データを削除しますか？")) return;
    state.evaluations = state.evaluations.filter((v) => v.id !== evaluationId);
    saveState();
    renderPage();
    showToast("評価データを削除しました。");
  }

  function setCandidateStatusFilter(value) {
    state.ui.candidateStatusFilter = value === "all" || STATUS_SET.has(value) ? value : "all";
    saveState();
    renderCandidates();
  }

  function clearCandidateFilters() {
    const search = document.getElementById("candidate-search");
    const sort = document.getElementById("candidate-sort");
    if (search) search.value = "";
    if (sort) sort.value = "updated_desc";
    state.ui.candidateStatusFilter = "all";
    saveState();
    renderCandidates();
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `recruit-tracker-pro-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast("JSONをエクスポートしました。");
  }

  function importJSON(event) {
    const input = event?.target;
    const file = input?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        state = normalizeState(JSON.parse(String(reader.result || "{}")));
        saveState();
        renderPage();
        showToast("JSONを読み込みました。");
      } catch (_error) {
        showToast("JSONの読み込みに失敗しました。");
      }
      if (input) input.value = "";
    };
    reader.readAsText(file);
  }

  function seedSampleData() {
    if (state.candidates.length && !window.confirm("既存データがあります。サンプルデータで上書きしますか？")) return;
    const now = new Date();
    const dateStr = (offsetDays) => {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offsetDays);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };
    const iso = (offsetDays, hour) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + offsetDays, hour, 0, 0).toISOString();
    state = normalizeState({
      candidates: [
        { id: "cand_1", name: "山田 太郎", kana: "ヤマダ タロウ", phone: "090-1111-2222", email: "yamada@example.com", source: "求人媒体", jobCategory: "介護職", employmentType: "正社員", appliedBranch: "なにわ", status: "interview", priority: "high", appliedAt: dateStr(-18), notes: "バックエンド経験5年", createdAt: iso(-18, 10), updatedAt: iso(-1, 15) },
        { id: "cand_2", name: "佐藤 花子", kana: "サトウ ハナコ", phone: "080-3333-4444", email: "sato@example.com", source: "エージェント", jobCategory: "看護職", employmentType: "正社員", appliedBranch: "玉造", status: "offer", priority: "high", appliedAt: dateStr(-24), notes: "PM経験あり", createdAt: iso(-24, 11), updatedAt: iso(-2, 11) },
        { id: "cand_3", name: "鈴木 一郎", kana: "スズキ イチロウ", phone: "070-5555-6666", email: "suzuki@example.com", source: "リファラル", jobCategory: "介護職", employmentType: "契約社員", appliedBranch: "堺", status: "hired", priority: "medium", appliedAt: dateStr(-40), hiredAt: dateStr(-5), notes: "SRE経験", createdAt: iso(-40, 12), updatedAt: iso(-5, 10) },
        { id: "cand_4", name: "田中 美咲", kana: "タナカ ミサキ", phone: "090-7777-8888", email: "tanaka@example.com", source: "ダイレクト", jobCategory: "事務職", employmentType: "パート", appliedBranch: "玉造", status: "screening", priority: "medium", appliedAt: dateStr(-7), notes: "UIデザイナー", createdAt: iso(-7, 16), updatedAt: iso(-2, 9) },
        { id: "cand_5", name: "高橋 健", kana: "タカハシ ケン", phone: "080-9999-0000", email: "takahashi@example.com", source: "自社サイト", jobCategory: "介護職", employmentType: "パート", appliedBranch: "なにわ", status: "applied", priority: "low", appliedAt: dateStr(-2), notes: "", createdAt: iso(-2, 14), updatedAt: iso(-2, 14) }
      ],
      interviews: [
        { id: "int_1", candidateId: "cand_1", scheduledAt: iso(1, 14), type: "二次", interviewerPrimary: "開発部長", interviewerSecondary: "サービス提供責任者", locationType: "remote", meetingUrl: "https://example.com/meeting-1", result: "scheduled", notes: "設計課題のディスカッション", createdAt: iso(-2, 10), updatedAt: iso(-1, 12) },
        { id: "int_2", candidateId: "cand_2", scheduledAt: iso(3, 11), type: "最終", interviewerPrimary: "CTO", interviewerSecondary: "事業所長", locationType: "naniwa", meetingUrl: "", result: "scheduled", notes: "オファー条件確認", createdAt: iso(-3, 10), updatedAt: iso(-2, 12) }
      ],
      evaluations: [
        {
          id: "eva_1",
          candidateId: "cand_1",
          interviewId: "int_1",
          evaluator1Name: "開発部長",
          evaluator2Name: "サービス提供責任者",
          evaluator1Scores: { greeting: 4, timeSense: 4, careMind: 4, homeCareUnderstanding: 4, cleanliness: 4, ownership: 4, physicalStrength: 4, mobilityTolerance: 4, qaResponse: 4, cooperativeness: 4 },
          evaluator2Scores: { greeting: 4, timeSense: 5, careMind: 4, homeCareUnderstanding: 4, cleanliness: 4, ownership: 4, physicalStrength: 4, mobilityTolerance: 4, qaResponse: 4, cooperativeness: 4 },
          evaluator1Total: 40,
          evaluator2Total: 41,
          total: 40.5,
          evaluator1SubmittedAt: iso(-5, 18),
          evaluator2SubmittedAt: iso(-5, 18),
          questionRecorderName: "開発部長",
          questionAnswers: { q1: "介護施設で5年勤務", q2: "在宅支援に興味", q3: "クレーム対応を上司と改善", q4: "確認しながら提案", q5: "尊重と安全第一" },
          overviewChecklist: {
            vision: true,
            profitReturn: true,
            trainingPolicy: true,
            salesOptional: true,
            demerit1: true,
            demerit2: true,
            demerit3: true,
            demerit4: true,
            demerit5: true
          },
          anxietyPoint: "移動時間の管理",
          gapPoint: "営業が任意なのは安心",
          pamphletShared: true,
          interviewClosed: true,
          dangerFlags: { conditionsFocus: false, healthConcern: false },
          evaluator1Comment: "受け答えが安定しており現場適応の見込みあり。",
          evaluator2Comment: "訪問理解は十分。初期同行で移動負荷を確認したい。",
          comment: "全体的に安定。訪問理解も十分。",
          createdAt: iso(-5, 18),
          updatedAt: iso(-5, 18)
        },
        {
          id: "eva_2",
          candidateId: "cand_2",
          interviewId: "int_2",
          evaluator1Name: "CTO",
          evaluator2Name: "事業所長",
          evaluator1Scores: { greeting: 5, timeSense: 5, careMind: 4, homeCareUnderstanding: 4, cleanliness: 5, ownership: 4, physicalStrength: 4, mobilityTolerance: 4, qaResponse: 4, cooperativeness: 4 },
          evaluator2Scores: { greeting: 4, timeSense: 4, careMind: 4, homeCareUnderstanding: 4, cleanliness: 4, ownership: 4, physicalStrength: 4, mobilityTolerance: 4, qaResponse: 4, cooperativeness: 4 },
          evaluator1Total: 43,
          evaluator2Total: 40,
          total: 41.5,
          evaluator1SubmittedAt: iso(-7, 19),
          evaluator2SubmittedAt: iso(-7, 19),
          questionRecorderName: "CTO",
          questionAnswers: { q1: "看護師として7年勤務", q2: "訪問現場に関心", q3: "難ケースに多職種連携で対応", q4: "背景確認後に代替案提示", q5: "利用者中心・読書で気分転換" },
          overviewChecklist: {
            vision: true,
            profitReturn: true,
            trainingPolicy: true,
            salesOptional: true,
            demerit1: true,
            demerit2: true,
            demerit3: true,
            demerit4: true,
            demerit5: true
          },
          anxietyPoint: "雨天時の移動",
          gapPoint: "記録ルールの細かさ",
          pamphletShared: true,
          interviewClosed: true,
          dangerFlags: { conditionsFocus: false, healthConcern: false },
          evaluator1Comment: "時間感覚と挨拶が特に良い。",
          evaluator2Comment: "記録ルール説明後の理解速度が高い。",
          comment: "即戦力候補。配属前研修で調整。",
          createdAt: iso(-7, 19),
          updatedAt: iso(-7, 19)
        }
      ],
      settings: {
        companyName: "サンプル株式会社",
        monthlyTarget: 4,
        reminderDays: 5,
        sourceOptions: [...DEFAULT_SOURCE_OPTIONS],
        jobOptions: [...DEFAULT_JOB_OPTIONS],
        employmentOptions: [...DEFAULT_EMPLOYMENT_OPTIONS],
        branchOptions: [...DEFAULT_BRANCH_OPTIONS]
      },
      ui: { candidateStatusFilter: "all" }
    });
    saveState();
    renderPage();
    showToast("サンプルデータを投入しました。");
  }

  function resetAllData() {
    if (!window.confirm("全データを初期化します。よろしいですか？")) return;
    state = createDefaultState();
    saveState();
    renderPage();
    showToast("データを初期化しました。");
  }

  function init() {
    state = loadState();
    if (!ensureAuthenticated()) return;
    activateNav();
    renderPage();
  }

  const App = {
    init,
    closeModal,
    renderCandidates,
    clearCandidateFilters,
    setCandidateStatusFilter,
    openCandidateModal,
    deleteCandidate,
    openInterviewModal,
    deleteInterview,
    openEvaluationModal,
    deleteEvaluation,
    addSettingOptionFromInput,
    removeSettingOption,
    addSourceOptionFromInput,
    removeSourceOption,
    exportJSON,
    importJSON,
    seedSampleData,
    resetAllData
  };

  window.App = App;
  document.addEventListener("DOMContentLoaded", init);
})();
