(function () {
  const sourceDocuments = [
    {
      id: "provincial-2025-18",
      authority: "安徽省总工会",
      title: "安徽省基层工会经费收支管理实施办法",
      documentNo: "皖工发〔2025〕18号",
      date: "2025-08-21",
      pages: 20,
      role: "核心经费制度依据",
      note: "规定工会经费支出范围、会员资格、福利上限、审批与财务监督。"
    },
    {
      id: "maanshan-2026-4",
      authority: "马鞍山市总工会",
      title: "关于深化职工“诗城田园游”疗休养活动的意见",
      documentNo: "马工发〔2026〕4号",
      date: "2026-05-15",
      pages: 7,
      role: "市级疗休养专项依据",
      note: "明确活动对象、地点范围、2天时限、400元/人/天限额、保险和采购要求。"
    },
    {
      id: "linhai-package",
      authority: "安徽和县林海生态园",
      title: "职工疗休养基地专属方案",
      documentNo: "承办方方案",
      date: "2026-06-30",
      pages: 31,
      role: "承办报价与路线参考",
      note: "属承办单位方案，不作为经费额度依据；参考价为780元/人，含两天一晚交通、住宿、餐饮、保险和活动。"
    }
  ];

  const ruleCards = [
    {
      id: "member-eligibility",
      module: "general",
      level: "block",
      title: "集体福利资格",
      summary: "工资未纳入工会经费工资总额或未缴纳会费的会员，不得享受集体福利；借用、挂职、劳务派遣人员只能享受一处集体福利。",
      sourceId: "provincial-2025-18",
      page: "9-10"
    },
    {
      id: "retiree-benefits",
      module: "general",
      level: "block",
      title: "离退休人员经费边界",
      summary: "离退休职工按规定可享受的待遇由单位行政确定并在行政列支，不可在基层工会工会经费中开支。",
      sourceId: "provincial-2025-18",
      page: "10"
    },
    {
      id: "festival-quota",
      module: "benefits",
      level: "block",
      title: "节日慰问年度限额",
      summary: "法定节日可向全体会员发放慰问品，每人每年累计不超过2200元；不得发放现金和购物卡，可发实物或指定商家提货券。",
      sourceId: "provincial-2025-18",
      page: "9"
    },
    {
      id: "birthday-quota",
      module: "benefits",
      level: "block",
      title: "生日慰问",
      summary: "会员生日可发不超过500元的蛋糕、长寿面等实物，或蛋糕券。",
      sourceId: "provincial-2025-18",
      page: "9"
    },
    {
      id: "major-benefit-quota",
      module: "benefits",
      level: "block",
      title: "婚育、住院、丧事、退休慰问",
      summary: "结婚、政策内生育、生病住院、会员或近亲属去世、退休离岗等单项慰问原则上不超过2000元；住院同一病种一年只能慰问一次。",
      sourceId: "provincial-2025-18",
      page: "9-10"
    },
    {
      id: "difficulty-support",
      module: "benefits",
      level: "warn",
      title: "困难职工帮扶",
      summary: "因大病、意外、子女就学等致困时，可一次性给予不超过2000元慰问金，并应建立困难职工档案。",
      sourceId: "provincial-2025-18",
      page: "12"
    },
    {
      id: "real-name-issue",
      module: "benefits",
      level: "block",
      title: "实名审批与签收",
      summary: "个人奖励、补助、慰问金、帮扶款和慰问品等要求审批手续齐全、实名发放、实名签收。",
      sourceId: "provincial-2025-18",
      page: "16"
    },
    {
      id: "exam-administrative-duty",
      module: "exams",
      level: "block",
      title: "职工体检经费责任",
      summary: "职工体检属于单位行政保障职责；受行政委托，基层工会可协助或承办，但经费由单位行政负担。",
      sourceId: "provincial-2025-18",
      page: "17"
    },
    {
      id: "retreat-target",
      module: "retreats",
      level: "block",
      title: "疗休养对象",
      summary: "对象为马鞍山市已建立工会组织的机关、企业、事业单位在职职工，各单位原则上每年至少开展一次。",
      sourceId: "maanshan-2026-4",
      page: "2"
    },
    {
      id: "retreat-location",
      module: "retreats",
      level: "block",
      title: "疗休养地点范围",
      summary: "须在现有和后续挂牌的各级职工疗休养基地、文旅部门认定的“皖美民宿”范围内开展。",
      sourceId: "maanshan-2026-4",
      page: "2,5-7"
    },
    {
      id: "retreat-days",
      module: "retreats",
      level: "block",
      title: "活动时限",
      summary: "“诗城田园游”疗休养活动时间不超过2天。",
      sourceId: "maanshan-2026-4",
      page: "2"
    },
    {
      id: "retreat-cost",
      module: "retreats",
      level: "block",
      title: "费用限额",
      summary: "党政机关和事业单位按每人每天不高于400元限额，凭据在单位福利费、工会经费中列支；超标部分由职工个人承担。",
      sourceId: "maanshan-2026-4",
      page: "3"
    },
    {
      id: "retreat-insurance",
      module: "retreats",
      level: "block",
      title: "人身意外保险",
      summary: "应为每位参加职工购买人身意外伤害保险，并做好交通、食宿等全流程保障。",
      sourceId: "maanshan-2026-4",
      page: "3-4"
    },
    {
      id: "retreat-procurement",
      module: "retreats",
      level: "block",
      title: "承办单位采购",
      summary: "按公开、公平、公正原则确定承办单位，根据采购管理规定履行程序，须公开招标的依法组织公开招标。",
      sourceId: "maanshan-2026-4",
      page: "2-4"
    },
    {
      id: "retreat-family",
      module: "retreats",
      level: "warn",
      title: "家属随行",
      summary: "家属可随同参加，但须与承办单位订立合同，费用自理、责任自负。",
      sourceId: "maanshan-2026-4",
      page: "3"
    },
    {
      id: "retreat-prohibited",
      module: "retreats",
      level: "block",
      title: "禁止变相旅游",
      summary: "严禁以疗休养名义发放钱物、组织变相公款旅游，杜绝违规报销、虚列开支和铺张浪费。",
      sourceId: "maanshan-2026-4",
      page: "4"
    },
    {
      id: "budget-control",
      module: "budget",
      level: "block",
      title: "预算管理",
      summary: "严禁无预算、超预算列支；预算调整原则上每年一次，审批程序与原预算一致。",
      sourceId: "provincial-2025-18",
      page: "15"
    },
    {
      id: "collective-decision",
      module: "budget",
      level: "block",
      title: "重大收支集体决策",
      summary: "各项收支实行工会委员会集体领导下的主席负责制，重大收支须集体研究决定。",
      sourceId: "provincial-2025-18",
      page: "15-16"
    }
  ];

  const allowedRetreatLocations = [
    "和县温泉度假村",
    "世纪缘泊漫酒店有限公司",
    "青舍民宿",
    "采石皇华驿酒店",
    "褒禅山度假村",
    "香泉桃花源民宿",
    "凌家滩考古研学小镇",
    "林海生态园",
    "绿野水乡度假村",
    "九间堂民宿",
    "速8酒店",
    "江东颐养中心",
    "南湖宾馆",
    "潘村民宿",
    "沿河客栈",
    "新庄乡村mall",
    "丹阳湖盛农农场",
    "护河镇桃花坞农家乐山庄",
    "梦都雨山湖饭店",
    "明发大酒店有限公司",
    "维也纳国际酒店（马鞍山博望汇盛广场店）",
    "濮塘桃里度假村",
    "安徽华阳开元国际酒店",
    "在水一方生态园",
    "曼居酒店",
    "忆味轩休闲农庄",
    "百峰荷塘疗养基地",
    "三棵树花园民宿",
    "悦语湖景酒店",
    "南熙庄园",
    "花山区三棵树民宿（乙级）",
    "当涂县九间堂民宿（丙级）",
    "含山县枕水涧民宿",
    "含山县青舍民宿（丙级）",
    "含山县沿河客栈民宿",
    "和县半月湖·新庄",
    "和县林海生态园精品民宿",
    "含山县潘村民宿（丙级）",
    "含山县梧桐山居民宿",
    "和县桃居牧园民宿（丙级）",
    "当涂县南熙花园民宿",
    "当涂县百果园民宿",
    "当涂县万山农庄民宿",
    "当涂县桃花坞民宿",
    "博望区百峰·荷塘拾舍乡宿",
    "含山县玉韵府民宿",
    "含山县繁花之境民宿",
    "含山县鸣鹿堂民宿",
    "含山县林头镇革命招待所",
    "和县在水一方民宿",
    "和县白果山庄民宿",
    "当涂县桃花开了驿站",
    "当涂县悦雅楠舍民宿",
    "当涂县三闲山舍民宿",
    "当涂县青柠栖息民宿",
    "花山区濮塘桃里度假村"
  ];

  const benefitTypes = [
    { id: "festival", label: "节日慰问", limit: 2200, aggregate: true, paymentRule: "no-cash-no-shopping-card" },
    { id: "birthday", label: "生日慰问", limit: 500, oncePerYear: true, paymentRule: "physical-or-cake-voucher" },
    { id: "marriage", label: "结婚慰问", limit: 2000, oncePerMember: true },
    { id: "birth", label: "生育慰问", limit: 2000, eventBased: true },
    { id: "hospital", label: "住院慰问", limit: 2000, duplicateKey: "condition", oncePerYear: true },
    { id: "death_member", label: "会员去世慰问", limit: 2000, eventBased: true },
    { id: "death_family", label: "近亲属去世慰问", limit: 2000, eventBased: true },
    { id: "retirement", label: "退休离岗慰问", limit: 2000, oncePerMember: true },
    { id: "difficulty", label: "困难帮扶", limit: 2000, oncePerYear: true },
    { id: "other_member", label: "其他会员慰问", limit: 2000, requiresReview: true }
  ];

  const benefitPaymentMethods = [
    { id: "physical", label: "实物", allowedFor: ["festival", "birthday", "marriage", "birth", "hospital", "death_member", "death_family", "retirement", "difficulty", "other_member"] },
    { id: "merchant_voucher", label: "指定商家提货券", allowedFor: ["festival"] },
    { id: "cake_voucher", label: "蛋糕券", allowedFor: ["birthday"] },
    { id: "cash", label: "现金", allowedFor: ["marriage", "birth", "hospital", "death_member", "death_family", "difficulty", "other_member"] },
    { id: "shopping_card", label: "购物卡", allowedFor: [] }
  ];

  const budgetLines = [
    { id: "member_activity", label: "会员活动支出" },
    { id: "retreat", label: "劳模职工疗休养支出" },
    { id: "service", label: "职工服务支出" },
    { id: "rights", label: "维权支出" },
    { id: "education", label: "职工教育支出" },
    { id: "sports", label: "文体活动支出" },
    { id: "publicity", label: "宣传活动支出" },
    { id: "business", label: "业务支出" },
    { id: "capital", label: "资本性支出" },
    { id: "other", label: "其他支出" }
  ];

  const linhaiRouteOptions = [
    {
      id: "wellness-1",
      name: "康养休闲路线1",
      highlights: "褒禅山·华阳洞、林海生态园、浮沙圩湿地公园",
      suitableFor: "偏重景区观光和园区休闲"
    },
    {
      id: "wellness-2",
      name: "康养休闲路线2",
      highlights: "鸡笼山·半月湖、林海生态园、浮沙圩湿地公园",
      suitableFor: "偏重湖泊景观和轻松游览"
    },
    {
      id: "culture-1",
      name: "文化生态路线1",
      highlights: "和县镇淮街千年中轴线、鸡笼山·半月湖、林海生态园",
      suitableFor: "偏重文化参观与生态体验"
    },
    {
      id: "culture-2",
      name: "文化生态路线2",
      highlights: "和县镇淮街千年中轴线、褒禅山·华阳洞、鳌鱼岭大庙村",
      suitableFor: "偏重历史文化与乡村观光"
    }
  ];

  window.UnionPolicyData = {
    sourceDocuments,
    ruleCards,
    allowedRetreatLocations,
    benefitTypes,
    benefitPaymentMethods,
    budgetLines,
    linhaiRouteOptions,
    organizationDefaults: {
      name: "慈湖高新区机关工会",
      fiscalYear: new Date().getFullYear(),
      dataOwner: "工会经办人员"
    }
  };
})();
