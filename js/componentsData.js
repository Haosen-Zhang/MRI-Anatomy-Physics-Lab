
/* =========================================================================
   MRI Anatomy & Physics Lab — scientific content model
   Coordinates: Z = bore axis / B0 direction, Y = vertical, X = patient left-right
   Origin = magnet isocenter. Units: metres in the 3D scene.
   System colours are categorical only; they are not material or field-direction keys.
   ========================================================================= */

export const BORE_RADIUS = 0.35;
export const FIELD_STRENGTHS = [1.5, 3.0];
export const GYRO_MHZ_PER_T = 42.577478;

export const REFERENCES = [
  {
    id: "ismrm",
    short: "ISMRM 2018",
    title: "MRI: A Systems Overview",
    authors: "International Society for Magnetic Resonance in Medicine",
    year: "2018",
    url: "https://cds.ismrm.org/protected/18MProceedings/PDFfiles/E1031.html",
    note: {
      zh: "MRI 系统级架构、主磁场、梯度与 RF 链路的教学概览。",
      en: "Educational system-level overview of the main field, gradients and RF chain.",
    },
  },
  {
    id: "larson",
    short: "Larson MRI System",
    title: "Principles of MRI — The MRI System",
    authors: "Peder E. Z. Larson",
    year: "n.d.",
    url: "https://larsonlab.github.io/MRI-education-resources/MRI%20System.html",
    note: {
      zh: "系统组成、梯度编码、RF 发射/接收与脉冲序列的基础教学资料。",
      en: "Teaching notes on system components, spatial encoding, RF and pulse sequences.",
    },
  },
  {
    id: "nibib",
    short: "NIH / NIBIB",
    title: "Magnetic Resonance Imaging (MRI)",
    authors: "National Institute of Biomedical Imaging and Bioengineering",
    year: "n.d.",
    url: "https://www.nibib.nih.gov/science-education/science-topics/magnetic-resonance-imaging-mri",
    note: {
      zh: "面向公众与学生的 MRI 成像原理与安全概览。",
      en: "Public-facing overview of MRI principles and safety.",
    },
  },
  {
    id: "canon",
    short: "Canon MRI",
    title: "MRI Scanners — Technology",
    authors: "Canon Medical Systems",
    year: "n.d.",
    url: "https://global.canon/en/technology/canon-tech/tech/mri/",
    note: {
      zh: "超导磁体、梯度系统、RF 与重建链路的工业概览。",
      en: "Industrial overview of superconducting magnets, gradients, RF and reconstruction.",
    },
  },
  {
    id: "rsna",
    short: "RSNA RadioGraphics",
    title: "Clinical MRI RF Coils: A Practical Guide",
    authors: "Radiographics / RSNA",
    year: "2021",
    url: "https://pubs.rsna.org/radiology/doi/10.1148/rg.210110",
    note: {
      zh: "临床 RF 线圈类型、阵列接收、重叠与并行成像硬件基础。",
      en: "Clinical RF coil types, receive arrays, overlap and parallel-imaging hardware.",
    },
  },
  {
    id: "nist",
    short: "NIST / CODATA",
    title: "Proton gyromagnetic ratio and fundamental constants",
    authors: "NIST / CODATA",
    year: "2022",
    url: "https://physics.nist.gov/cuu/Constants/",
    note: {
      zh: "质子旋磁比 γ/2π ≈ 42.577 MHz/T；用于本页 Larmor 频率计算。",
      en: "Proton gyromagnetic ratio γ/2π ≈ 42.577 MHz/T used for Larmor calculations.",
    },
  },
];

export const LEVELS = {
  A: {
    label: "LEVEL A",
    name: { zh: "文献支持", en: "Documented principle" },
    desc: {
      zh: "直接来自教材、综述或公开物理关系的基本原理。",
      en: "Foundational principle directly described in textbooks, reviews or public literature.",
    },
    className: "level-a",
  },
  B: {
    label: "LEVEL B",
    name: { zh: "典型工程架构", en: "Typical engineering architecture" },
    desc: {
      zh: "公开资料中常见的工程结构，但具体布局和数量为教学重建。",
      en: "Common engineering architecture from public sources; exact layout and counts are teaching reconstructions.",
    },
    className: "level-b",
  },
  C: {
    label: "LEVEL C",
    name: { zh: "教学示意", en: "Schematic / illustrative" },
    desc: {
      zh: "用于解释空间关系或流程的简化模型，不代表任何厂商图纸或制造尺寸。",
      en: "Simplified teaching representation; not a vendor drawing or manufacturing dimension.",
    },
    className: "level-c",
  },
};

export const CATEGORIES = [
  { id: "patient", zh: "患者接口与外部结构", en: "Patient Interface & Gantry", color: "#9eb2bf" },
  { id: "magnet", zh: "超导磁体与低温系统", en: "Superconducting Magnet & Cryogenics", color: "#5f9fe8" },
  { id: "gradient", zh: "梯度线圈系统", en: "Gradient System", color: "#f3a04d" },
  { id: "shim", zh: "匀场系统", en: "Shim System", color: "#e3cf7d" },
  { id: "rf", zh: "射频发射与接收", en: "RF Transmit & Receive", color: "#a38bf2" },
  { id: "electronics", zh: "电子、控制与机房", en: "Electronics, Control & Room", color: "#aab7c3" },
];

const l = (zh, en) => ({ zh, en });

export const PARTS = [
  {
    id: "housing",
    cat: "patient",
    order: 1,
    color: "#92a8b8",
    level: "B",
    name: l("外部机壳与孔径前端", "Outer Housing & Bore Interface"),
    subtitle: l("非承压外罩 / 患者接口", "Non-pressure cosmetic enclosure / patient interface"),
    structure: l(
      "由前后端盖、外部覆盖板、70 cm 级患者孔径环、孔径内衬与通风面板组成。它不是承压容器；真空与低温密封由内部低温恒温器承担。",
      "Front and rear covers, external panels, a ≈70 cm-class patient bore ring, bore liner and ventilation panels. It is not the pressure boundary; vacuum and cryogenic sealing belong to the internal cryostat."
    ),
    principle: l(
      "提供临床接触面、声学包覆与患者接口，同时把低温恒温器封装在内部。本教学模型选用通用低氦量超导磁体架构，孔径约 70 cm。",
      "Provides the clinical touch surfaces, acoustic treatment and patient interface while enclosing the cryostat. This teaching model uses a generic low-helium superconducting architecture with a ≈70 cm bore."
    ),
    material: l("玻璃纤维增强复合材料、喷涂钢板、吸声层、非铁磁装饰件", "GFRP, painted steel covers, acoustic foam, non-ferromagnetic trim"),
    specs: [
      { k: l("患者孔径", "Patient bore"), v: "≈ 70 cm", note: l("教学级", "teaching value") },
      { k: l("结构属性", "Structural role"), v: l("非承压外罩", "Non-pressure enclosure") },
      { k: l("布局", "Layout"), v: l("前/后端盖 + 内衬", "End covers + liner") },
    ],
    relations: ["ovv", "patient-table", "rf-shield"],
    impact: l(
      "不直接参与成像；它决定患者空间、声学舒适度和维护可达性。外壳不产生 B0。",
      "Does not directly generate the image. It defines patient space, acoustic comfort and service access; it does not generate B0."
    ),
    safety: l(
      "外罩附近仍处于强杂散磁场区。任何铁磁物体、气瓶或工具都必须经过 MR 安全筛查；外壳本身不能屏蔽主磁场。",
      "The housing remains inside the strong stray-field region. All ferromagnetic objects, gas cylinders and tools require MR safety screening; the cover does not shield B0."
    ),
    refs: ["ismrm", "canon", "larson"],
    anchor: [0, 1.14, 0.78],
    labelPriority: 8,
    home: [0, 0, 0],
    explode: [0, 1.75, -0.2],
    ghost: true,
    maxGhost: 0.2,
  },
  {
    id: "patient-table",
    cat: "patient",
    order: 2,
    color: "#87a2b4",
    level: "B",
    name: l("患者检查床与定位滑轨", "Patient Table & Positioning Rail"),
    subtitle: l("患者定位系统", "Patient positioning system"),
    structure: l(
      "包含非铁磁床板、可移动床面、纵向滑轨、驱动底座、定位标记与电缆/线圈接口。床面沿 Z 轴滑入，使目标解剖中心对齐 isocenter。",
      "Includes a non-ferromagnetic tabletop, movable patient pallet, longitudinal rail, drive base, alignment features and coil/data connections. The pallet translates along Z to align the target anatomy with isocenter."
    ),
    principle: l(
      "床面纵向定位用于将扫描部位送至等中心；位置编码允许系统恢复检查床位置。本模型床面插入距离为示意值。",
      "Longitudinal motion positions the target anatomy at isocenter; position encoding allows the system to restore table location. Insertion distances here are schematic."
    ),
    material: l("碳纤维/复合床板、铝合金滑轨、PEEK 或非铁磁紧固件、柔性线缆", "Carbon-fibre/composite pallet, aluminium rail, PEEK or non-ferromagnetic fasteners, flexible cabling"),
    specs: [
      { k: l("运动轴", "Motion axis"), v: "Z（纵向）", note: l("滑轨示意", "rail schematic") },
      { k: l("对齐目标", "Alignment target"), v: "Isocenter" },
      { k: l("材料要求", "Material requirement"), v: l("非铁磁", "non-ferromagnetic") },
    ],
    relations: ["housing", "head-coil", "body-coil"],
    impact: l(
      "不参与编码，但位置误差会造成解剖中心偏移、局部线圈失谐和图像 SNR 变化。",
      "Not involved in encoding, but position error shifts the anatomy, can detune local coils and change SNR."
    ),
    safety: l(
      "检查床必须锁定并避免夹伤；铁磁床具、氧气瓶和监护设备不得进入扫描室。",
      "The table must be locked and pinch hazards managed; ferromagnetic beds, oxygen cylinders and monitoring hardware must not enter the scan room."
    ),
    refs: ["ismrm", "canon"],
    anchor: [0, -0.26, 2.0],
    labelPriority: 4,
    home: [0, 0, 0],
    explode: [0, -0.72, 1.4],
    ghost: false,
  },
  {
    id: "ovv",
    cat: "magnet",
    order: 3,
    color: "#5e8fbe",
    level: "B",
    name: l("外真空容器 OVV", "Outer Vacuum Vessel (OVV)"),
    subtitle: l("低温恒温器外部真空边界", "Cryostat vacuum boundary"),
    structure: l(
      "环绕低温恒温器的高真空钢壳，包含抽气口、服务塔安装面、冷头接口与失超管道穿越结构。容器与室温孔径之间有真空绝热空间。",
      "High-vacuum steel envelope around the cryostat, with evacuation ports, service-turret interfaces, cold-head ports and quench-line penetrations. A vacuum insulation space separates it from the room-temperature bore."
    ),
    principle: l(
      "维持 <10⁻³ Pa 级高真空以抑制气体传导；与多层绝热层共同降低室温向 4 K 冷质量的漏热。本页以典型结构表现，不提供真实真空数据。",
      "Maintains a high-vacuum region to suppress gas conduction; with MLI it reduces heat leak from room temperature to the ≈4 K cold mass. The page shows typical architecture, not real vacuum data."
    ),
    material: l("不锈钢或铝合金真空容器、焊接法兰、环氧密封、非磁性支撑", "Stainless steel or aluminium vacuum vessel, welded flanges, epoxy seals, non-magnetic supports"),
    specs: [
      { k: l("绝热目标", "Insulation target"), v: "≈ 4 K cold mass", note: l("典型", "typical") },
      { k: l("真空角色", "Vacuum role"), v: l("高真空绝热", "high-vacuum insulation") },
      { k: l("结构", "Architecture"), v: l("水平圆柱壳体", "horizontal cylindrical shell") },
    ],
    relations: ["housing", "thermal-shield", "cryo-service", "suspension"],
    impact: l(
      "不直接生成图像；真空退化会增加冷质量漏热、加速液氦损耗或提高冷头负荷，最终影响磁体稳定性与运行时间。",
      "Does not directly form the image; degraded vacuum increases heat load, helium boil-off or cold-head demand and can compromise magnet stability and uptime."
    ),
    safety: l(
      "真空容器和低温管线极冷。低温灼伤与压力风险要求由受训工程人员操作；失超时不得靠近排放口。",
      "Vessel and cryogenic lines can be extremely cold. Cold burns and pressure hazards require trained personnel; stay away from vent outlets during a quench."
    ),
    refs: ["ismrm", "canon"],
    anchor: [0, 1.03, 0],
    labelPriority: 7,
    home: [0, 0, 0],
    explode: [-1.5, 0.85, -0.5],
    ghost: true,
    maxGhost: 0.25,
  },
  {
    id: "thermal-shield",
    cat: "magnet",
    order: 4,
    color: "#83b8df",
    level: "B",
    name: l("热辐射屏蔽与多层绝热", "Thermal Shield & Multilayer Insulation"),
    subtitle: l("冷质量的热防护层", "Thermal protection for the cold mass"),
    structure: l(
      "由铝或不锈钢辐射屏蔽筒、多层反射箔（MLI）及低导热间隔件构成。屏蔽层包围氦容器，冷头通常与屏蔽层进行热连接。",
      "Aluminium or stainless radiation shields, reflective multilayer insulation (MLI) and low-conductance spacers surround the helium vessel. A cryocooler stage is commonly thermally linked to the shield."
    ),
    principle: l(
      "反射屏降低辐射传热，MLI 通过多层低发射率反射层抑制辐射与残余气体传导。层数、间隔与真空质量影响漏热；本模型只示意分层顺序。",
      "Reflective shields reduce radiative heat transfer, while MLI uses multiple low-emissivity layers to suppress radiation and residual-gas conduction. Layer count, spacing and vacuum quality affect heat leak; this model only shows the ordering."
    ),
    material: l("铝屏蔽、镀铝聚酯薄膜 MLI、低导热 GFRP 间隔", "Aluminium shield, aluminised PET MLI, low-conductance GFRP spacers"),
    specs: [
      { k: l("主要热传递", "Dominant transfer"), v: l("辐射 + 残余气体", "Radiation + residual gas") },
      { k: l("典型方式", "Typical method"), v: "MLI + 辐射屏蔽", note: l("层数未按真实值", "layer count schematic") },
      { k: l("冷头接口", "Cold-head link"), v: l("一级/屏冷", "first stage / shield") },
    ],
    relations: ["ovv", "helium-vessel", "cryo-service"],
    impact: l(
      "多层绝热退化会导致冷质量温升和液氦消耗增加，但不直接改变 RF 或梯度编码。",
      "MLI degradation raises cold-mass temperature and helium consumption, but does not directly alter RF or gradient encoding."
    ),
    safety: l(
      "MLI 易燃并可能在排气受阻时积聚压力。维护与焊接操作必须遵循低温系统程序。",
      "MLI can be flammable and may trap pressure if venting is obstructed. Maintenance and welding require cryogenic-system procedures."
    ),
    refs: ["canon", "ismrm"],
    anchor: [0.7, 0.55, 0],
    labelPriority: 5,
    home: [0, 0, 0],
    explode: [1.45, 1.15, -0.3],
    ghost: true,
    maxGhost: 0.3,
  },
  {
    id: "helium-vessel",
    cat: "magnet",
    order: 5,
    color: "#81ddff",
    level: "B",
    name: l("氦容器与冷质量", "Helium Vessel & Cold Mass"),
    subtitle: l("低氦量超导磁体的冷质量包络", "Cold-mass envelope of a low-helium magnet"),
    structure: l(
      "包围超导线圈和绕线骨架的低温容器，配有充注/回收管线、冷头热连接和失超安全通道。本教学模型采用低氦量与冷头再冷凝的典型架构，不渲染大型开放液氦浴。",
      "Cryogenic vessel surrounding the superconducting windings and former, with fill/recovery lines, cold-head thermal links and quench paths. This teaching model adopts a low-helium, cryocooler-recondensing architecture rather than a large open liquid-helium bath."
    ),
    principle: l(
      "液氦将绕组维持在约 4.2 K，使 NbTi 处于超导态。正常扫描时磁体保持在持续电流模式，B0 并非在每次扫描时开启。",
      "Liquid helium holds the winding at approximately 4.2 K so NbTi remains superconducting. In normal operation the magnet stays in persistent-current mode; B0 is not switched on for each scan."
    ),
    material: l("不锈钢/铝合金内胆、铌钛绕组、环氧浸渍、低温管路、超绝热层", "Stainless/aluminium vessel, NbTi windings, epoxy impregnation, cryogenic piping, superinsulation"),
    specs: [
      { k: l("工作温度", "Operating temp."), v: "≈ 4.2 K", note: l("NbTi 冷质量", "NbTi cold mass") },
      { k: l("架构", "Architecture"), v: l("低氦量 + 冷头再冷凝", "low-helium + recondensing") },
      { k: l("磁体模式", "Magnet mode"), v: l("持续电流", "persistent current"), note: l("扫描时不断电", "not switched per scan") },
    ],
    relations: ["main-coils", "thermal-shield", "cryo-service", "suspension"],
    impact: l(
      "冷质量温度稳定度关系到 B0 漂移和频率漂移。温度或压力变化会引入微小的共振频率漂移。",
      "Cold-mass thermal stability affects B0 and resonance-frequency drift. Temperature or pressure excursions can introduce small frequency shifts."
    ),
    safety: l(
      "正常运行时氦气应被封闭或再冷凝，不应持续向室外排放。失超会产生大量氦气并带来窒息风险；必须沿设计路径排放并疏散。",
      "In normal operation helium should be contained or recondensed, not continuously vented. A quench produces large helium volumes with asphyxiation risk; it must follow the engineered vent path and evacuation plan."
    ),
    refs: ["ismrm", "canon"],
    anchor: [0.58, 0.0, 0.2],
    labelPriority: 6,
    home: [0, 0, 0],
    explode: [0.9, -0.3, 0.8],
    ghost: true,
    maxGhost: 0.4,
  },
  {
    id: "main-coils",
    cat: "magnet",
    order: 6,
    color: "#5d9cff",
    level: "B",
    name: l("主超导线圈组", "Main Superconducting Coil Assembly"),
    subtitle: l("B0 的发生器", "B0 field generator"),
    structure: l(
      "沿 Z 轴分布的多个 NbTi 螺线管绕组组，绕制在低导热骨架上。绕组组通过优化轴向位置产生中心高均匀度的 B0。图中绕组数量与间距为教学示意。",
      "Several NbTi solenoid winding packs distributed along Z on a low-conductance former. Axial positions are arranged to generate a highly homogeneous central B0. Winding counts and spacing are instructional."
    ),
    principle: l(
      "超导绕组在持续电流模式下承载稳定电流，产生沿患者孔径轴的静态 B0 (Z)。超导体在临界温度、临界场和临界电流以下无阻运行。",
      "The superconducting winding carries persistent current and produces a static B0 along the patient-bore axis (Z). The superconductor operates below its critical temperature, field and current without resistive loss."
    ),
    material: l("NbTi 超导线、铜稳定基体、铝合金/不锈钢骨架、环氧树脂", "NbTi superconductor, copper stabiliser, aluminium/stainless former, epoxy"),
    specs: [
      { k: l("场强选项", "Field options"), v: "1.5 T / 3.0 T", note: l("页面可切换", "page toggle") },
      { k: l("导体参考", "Conductor"), v: "NbTi" },
      { k: l("工作模式", "Mode"), v: l("持续电流", "persistent current") },
    ],
    relations: ["helium-vessel", "shield-coils", "thermal-shield"],
    impact: l(
      "主磁体的均匀性、漂移和稳定性直接决定共振频率与图像几何一致性。B0 不均匀会导致几何畸变与信号丢失。",
      "Homogeneity, drift and stability of the main magnet directly affect resonance frequency and geometric consistency. B0 inhomogeneity can cause distortion and signal loss."
    ),
    safety: l(
      "超导磁体持续处于强磁场状态。不可将铁磁物体带入扫描室；失超、低温与强磁场是相互关联的安全风险。",
      "The superconducting magnet remains at high field. Never bring ferromagnetic objects into the scan room; quench, cryogen and magnetic hazards are coupled."
    ),
    refs: ["ismrm", "larson", "canon"],
    anchor: [0, 0.48, 0.42],
    labelPriority: 9,
    home: [0, 0, 0],
    explode: [-1.8, 0.1, 0.9],
    ghost: false,
  },
  {
    id: "shield-coils",
    cat: "magnet",
    order: 7,
    color: "#78b4ff",
    level: "B",
    name: l("主动屏蔽线圈组", "Active Shielding Coil Assembly"),
    subtitle: l("杂散场约束绕组", "Stray-field containment winding"),
    structure: l(
      "位于主动屏蔽磁体外侧的大直径反极性绕组组，与主线圈串联。它抵消外部空间的偶极场，从而缩短 5 G 线范围。",
      "Large-diameter, reverse-polarity winding packs outside the main coils, connected in series with the main winding. They cancel the external dipole field and shorten the 5 G footprint."
    ),
    principle: l(
      "主动屏蔽并不降低孔径内的 B0；它通过外部绕组产生与主线圈外泄磁场相反的场，降低 5 G 等值线。屏蔽绕组仍然属于超导主磁体系统。",
      "Active shielding does not reduce B0 in the bore. External windings produce a field opposite to the leakage field, reducing the 5 G contour. These windings still belong to the superconducting main-magnet system."
    ),
    material: l("NbTi 超导绕组、铜稳定基体、低导热屏蔽骨架", "NbTi winding, copper stabiliser, low-conductance shield former"),
    specs: [
      { k: l("目标", "Objective"), v: l("缩短杂散场边界", "reduce stray-field span") },
      { k: l("电气关系", "Electrical"), v: l("与主线圈串联", "series with main coil") },
      { k: l("安全边界", "Safety boundary"), v: l("5 G 线仍存在", "5 G line remains") },
    ],
    relations: ["main-coils", "helium-vessel", "rf-room"],
    impact: l(
      "不直接编码图像，但杂散场约束影响扫描室选址、设备兼容性和铁磁物体的危险区。",
      "Not directly involved in encoding, but stray-field containment governs siting, equipment compatibility and the hazardous ferromagnetic zone."
    ),
    safety: l(
      "主动屏蔽磁体的 5 G 区仍可能延伸至扫描室外。房间规划、屏蔽门与安全培训必须基于实测杂散场图。",
      "Even actively shielded magnets may have 5 G lines outside the scan room. Room planning, door interlocks and training must use measured stray-field maps."
    ),
    refs: ["ismrm", "canon"],
    anchor: [0.55, 0.35, -0.1],
    labelPriority: 4,
    home: [0, 0, 0],
    explode: [1.7, 1.8, -0.8],
    ghost: false,
  },
  {
    id: "cryo-service",
    cat: "magnet",
    order: 8,
    color: "#9edfff",
    level: "B",
    name: l("冷头、服务塔与失超排放", "Cold Head, Service Turret & Quench Vent"),
    subtitle: l("低温服务与安全通道", "Cryogenic service interface"),
    structure: l(
      "包含两级低温冷头、压缩机管路接口、充注/回收阀、服务塔与向室外导出的失超排放管。排放管独立于正常扫描运行。",
      "Two-stage cryocooler, compressor-line interface, fill/recovery valves, service turret and a quench vent routed outdoors. Normal scanning does not produce continuous gas discharge."
    ),
    principle: l(
      "冷头将热从辐射屏和氦容器泵出并再冷凝氦气；服务接口允许受训工程师进行液位检查与维护。失超时，排放通道必须安全导走蒸发氦。",
      "The cold head pumps heat from the radiation shield and helium vessel and recondenses helium. Service interfaces support trained engineers; during a quench, the vent path must safely carry away evaporating helium."
    ),
    material: l("不锈钢管路、铜冷头组件、低温阀门、环氧密封、标识件", "Stainless piping, copper cold-head parts, cryogenic valves, epoxy seals, labels"),
    specs: [
      { k: l("典型温度级", "Stage temperatures"), v: "≈ 40 K / ≈ 4 K", note: l("典型教学值", "typical teaching value") },
      { k: l("正常运行", "Normal operation"), v: l("封闭/再冷凝", "contained/recondensing") },
      { k: l("排放设计", "Vent design"), v: l("失超路径", "quench path") },
    ],
    relations: ["ovv", "thermal-shield", "helium-vessel", "electronics-racks"],
    impact: l(
      "冷头或压缩机异常会导致冷量不足、B0 漂移或被迫停机；正常扫描时不应出现持续液氦排放。",
      "Cold-head or compressor faults can cause insufficient cooling, B0 drift or an unscheduled shutdown; continuous helium venting is not normal scanning behaviour."
    ),
    safety: l(
      "失超排放口必须畅通并导向室外安全位置。氦气无色无味，可置换氧气；扫描室与排放路径需要氧监测和应急程序。",
      "Quench vents must remain unobstructed and route to a safe outdoor location. Helium is odourless and can displace oxygen; scan rooms and vent paths require oxygen monitoring and emergency procedures."
    ),
    refs: ["canon", "nibib"],
    anchor: [0, 1.16, -0.4],
    labelPriority: 3,
    home: [0, 0, 0],
    explode: [0.6, 2.15, -0.6],
    ghost: false,
  },
  {
    id: "suspension",
    cat: "magnet",
    order: 9,
    color: "#7aa2bf",
    level: "C",
    name: l("低振动悬挂与低导热支撑", "Low-Vibration, Low-Conductance Supports"),
    subtitle: l("冷质量机械支撑", "Cold-mass mechanical support"),
    structure: l(
      "由多根低导热复合材料支撑杆和隔振组件组成，将冷质量定位在真空容器内并限制重力与运输载荷下的位移。",
      "Multiple low-conductance composite struts and isolation elements locate the cold mass inside the vacuum vessel and limit displacement under gravity and transport loads."
    ),
    principle: l(
      "支撑必须同时满足低导热与足够刚度。过高导热的支撑会把室温热量带入冷质量；过低刚度则会增加振动和漂移。本页支撑杆数量与方向为示意。",
      "Supports must balance low thermal conduction with sufficient stiffness. Conductive supports admit heat to the cold mass; overly compliant supports increase vibration and drift. Count and orientation here are schematic."
    ),
    material: l("GFRP/碳纤维支撑杆、钛或不锈钢端部、隔振件", "GFRP/carbon-fibre struts, titanium or stainless ends, isolation elements"),
    specs: [
      { k: l("主要约束", "Key constraints"), v: l("低导热 + 高刚度", "low conduction + stiffness") },
      { k: l("数量", "Count"), v: l("示意配置", "schematic arrangement") },
    ],
    relations: ["ovv", "helium-vessel", "gradient-assembly"],
    impact: l(
      "机械振动会通过冷质量与梯度线圈传递，影响 B0 稳定度、梯度保真度和图像重影。",
      "Mechanical vibration can couple through the cold mass and gradient assembly, affecting B0 stability, gradient fidelity and image ghosting."
    ),
    safety: l(
      "不得擅自调整支撑预紧；错误安装会破坏真空、改变线圈位置并造成不可逆的磁场偏差。",
      "Do not adjust support preload without qualification; incorrect installation can breach vacuum, shift coil positions and cause irreversible field deviations."
    ),
    refs: ["canon", "ismrm"],
    anchor: [-0.45, 0.45, -0.2],
    labelPriority: 2,
    home: [0, 0, 0],
    explode: [-1.2, 1.75, -0.9],
    ghost: true,
    maxGhost: 0.35,
  },
  {
    id: "gradient-assembly",
    cat: "gradient",
    order: 10,
    color: "#a88352",
    level: "B",
    name: l("梯度线圈总成与冷却", "Gradient Assembly & Cooling"),
    subtitle: l("三轴梯度支撑、灌封与冷却", "Former, potting and cooling"),
    structure: l(
      "包围 B 0 孔径的圆柱形梯度线圈总成，包括 Gx/Gy/Gz 导体、主动屏蔽、玻璃纤维/环氧灌封、冷却通道与端部连接。",
      "Cylindrical gradient assembly surrounding the patient bore, including Gx/Gy/Gz conductors, active shielding, glass-fibre/epoxy potting, cooling channels and end connections."
    ),
    principle: l(
      "梯度线圈是脉冲电流驱动的室温电阻线圈，不是超导磁体。电流产生随空间变化的梯度场，用于空间编码。冷却通道带走焦耳热与涡流损耗。",
      "Gradient coils are room-temperature resistive coils driven by pulsed currents, not superconducting magnets. Current creates spatially varying fields for encoding; cooling removes Joule and eddy-current losses."
    ),
    material: l("铜/铜合金导体、环氧灌封、GFRP 结构、水冷通道、热敏电阻", "Copper alloy conductors, epoxy potting, GFRP structure, water channels, thermistors"),
    specs: [
      { k: l("典型峰值", "Typical peak"), v: l("30–45 mT/m", "30–45 mT/m"), note: l("3T 典型范围", "3T typical") },
      { k: l("典型切换率", "Typical slew"), v: l("120–200 T/m/s", "120–200 T/m/s"), note: l("示意范围", "illustrative") },
      { k: l("驱动", "Drive"), v: l("梯度功放", "gradient amplifier") },
    ],
    relations: ["gradient-gx", "gradient-gy", "gradient-gz", "gradient-shield", "electronics-racks"],
    impact: l(
      "梯度线性度影响空间定位；切换率影响 EPI/快速序列；振动与涡流会产生噪声、热和图像伪影。",
      "Gradient linearity affects spatial localisation; slew rate enables fast sequences such as EPI; vibration and eddy currents cause acoustic noise, heat and image artefacts."
    ),
    safety: l(
      "梯度线圈在工作时产生强振动与噪声并可发热；患者需佩戴听力保护，外周神经刺激（PNS）受限于梯度切换率和曝露模型。",
      "Active gradients create strong vibration and acoustic noise and can heat. Patients need hearing protection; peripheral nerve stimulation limits depend on slew rate and exposure models."
    ),
    refs: ["ismrm", "larson", "canon"],
    anchor: [0.36, -0.15, 0.38],
    labelPriority: 7,
    home: [0, 0, 0],
    explode: [0.1, -0.1, 1.55],
    ghost: true,
    maxGhost: 0.4,
  },
  {
    id: "gradient-gx",
    cat: "gradient",
    order: 11,
    color: "#ff9250",
    level: "C",
    name: l("Gx 梯度线圈", "Gx Gradient Coil"),
    subtitle: l("横向鞍形绕组 · 右—左编码", "Transverse saddle winding · L-R encoding"),
    structure: l(
      "以 Golay 型鞍形导体为教学参考，在圆柱内表面布置沿 Z 的纵向回路与端部回弯，使 dBz/dx 在 FOV 内近似恒定。",
      "Uses a Golay-style saddle conductor as the teaching reference: longitudinal runs and end turns on a cylindrical surface produce an approximately constant dBz/dx over the FOV."
    ),
    principle: l(
      "Gx 使 Bz 随 x 线性变化。它并不产生沿 X 的“另一个 B0”；空间编码来自沿 x 的局部共振频率变化。",
      "Gx makes Bz vary linearly with x. It does not create another B0 along X; spatial encoding arises from the local resonance-frequency shift along x."
    ),
    material: l("铜或铜合金导体、环氧玻璃纤维绝缘、冷却通道", "Copper or copper-alloy conductor, epoxy/glass insulation, cooling channel"),
    specs: [
      { k: l("理想关系", "Ideal relation"), v: "∂Bz/∂x = Gx" },
      { k: l("空间轴", "Axis"), v: "X" },
      { k: l("极性", "Polarity"), v: l("可反转", "reversible") },
    ],
    relations: ["gradient-assembly", "gradient-gy", "gradient-gz"],
    impact: l(
      "Gx 非线性会造成 x 方向几何畸变；涡流与串扰会造成坐标串扰和重影。",
      "Gx non-linearity distorts x localisation; eddy currents and cross-talk cause coordinate mixing and ghosting."
    ),
    safety: l(
      "与所有梯度轴一样受 PNS 与热限制。梯度场不是主磁场，但快速切换仍会产生振动与噪声。",
      "Like every gradient axis it is constrained by PNS and heating. A gradient field is not B0, but fast switching still causes vibration and noise."
    ),
    refs: ["larson", "ismrm"],
    anchor: [0.4, 0.0, 0.2],
    labelPriority: 8,
    home: [0, 0, 0],
    explode: [1.75, -1.0, 1.55],
    ghost: false,
  },
  {
    id: "gradient-gy",
    cat: "gradient",
    order: 12,
    color: "#ffc067",
    level: "C",
    name: l("Gy 梯度线圈", "Gy Gradient Coil"),
    subtitle: l("横向鞍形绕组 · 前—后编码", "Transverse saddle winding · A-P encoding"),
    structure: l(
      "与 Gx 同类的鞍形结构，整体绕 Z 轴旋转约 90°，形成 dBz/dy 的线性梯度。",
      "A saddle-type structure of the same family as Gx, rotated about the Z axis by approximately 90° to create a linear dBz/dy gradient."
    ),
    principle: l(
      "Gy 使 Bz 随 y 线性变化。Gx 与 Gy 属于同一物理量 Bz 的空间梯度，不是两个独立的磁场方向。",
      "Gy makes Bz vary linearly with y. Gx and Gy are spatial gradients of the same physical quantity Bz, not two separate field directions."
    ),
    material: l("铜/铜合金导体、环氧绝缘、灌封与冷却结构", "Copper/copper-alloy conductor, epoxy insulation, potting and cooling"),
    specs: [
      { k: l("理想关系", "Ideal relation"), v: "∂Bz/∂y = Gy" },
      { k: l("空间轴", "Axis"), v: "Y" },
      { k: l("与 Gx 关系", "Relation to Gx"), v: l("约 90° 旋转", "≈90° rotated") },
    ],
    relations: ["gradient-assembly", "gradient-gx", "gradient-gz"],
    impact: l(
      "Gy 误差会造成 y 方向畸变；长回波序列对梯度时序与涡流更敏感。",
      "Gy errors distort y localisation; long-echo sequences are more sensitive to timing and eddy currents."
    ),
    safety: l(
      "PNS 风险取决于梯度波形和患者体型。线圈本身不会在扫描时产生持续的静磁场。",
      "PNS risk depends on the gradient waveform and patient geometry. The coil itself does not generate a persistent static field."
    ),
    refs: ["larson", "ismrm"],
    anchor: [0.0, 0.42, 0.2],
    labelPriority: 7,
    home: [0, 0, 0],
    explode: [-1.75, -1.0, 1.55],
    ghost: false,
  },
  {
    id: "gradient-gz",
    cat: "gradient",
    order: 13,
    color: "#ffac4c",
    level: "C",
    name: l("Gz 梯度线圈", "Gz Gradient Coil"),
    subtitle: l("Maxwell/anti-Helmholtz 示意 · 层选", "Maxwell/anti-Helmholtz schematic · slice select"),
    structure: l(
      "沿轴向分布的反向环形绕组，以 Maxwell/anti-Helmholtz 原理产生沿 Z 的线性梯度。切片选择常由 Gz 完成。",
      "Axially distributed loop windings with alternating current, following Maxwell/anti-Helmholtz principles to create a linear gradient along Z. Slice selection is commonly performed with Gz."
    ),
    principle: l(
      "Gz 改变 Bz 随 z 的变化，使不同 z 的层面的 Larmor 频率不同。RF 带宽/频率与 Gz 共同决定层厚和层位置。",
      "Gz changes Bz with z so spins at different z have different Larmor frequencies. RF bandwidth/frequency and Gz jointly determine slice position and thickness."
    ),
    material: l("铜导体、环氧树脂灌封、冷却通道", "Copper conductor, epoxy potting, cooling channels"),
    specs: [
      { k: l("理想关系", "Ideal relation"), v: "∂Bz/∂z = Gz" },
      { k: l("典型用途", "Typical role"), v: l("层选 + 相位编码", "slice select + phase encode") },
      { k: l("方向", "Axis"), v: "Z" },
    ],
    relations: ["gradient-assembly", "body-rf-coil", "gradient-gx"],
    impact: l(
      "Gz 非线性会造成层厚/层位置误差；梯度滞后会改变层轮廓并影响多层面一致性。",
      "Gz non-linearity misplaces or thickens slices; gradient lag alters slice profiles and consistency across slices."
    ),
    safety: l(
      "与 Gx/Gy 相同，受热、PNS 与噪声限制。不要把 Gz 与静态主磁场 B0 混为同一个磁场源。",
      "Like Gx/Gy it is constrained by heating, PNS and noise. Do not confuse Gz with the static main field B0."
    ),
    refs: ["larson", "ismrm"],
    anchor: [0.0, 0.38, 0.48],
    labelPriority: 8,
    home: [0, 0, 0],
    explode: [0.0, -2.1, 1.15],
    ghost: false,
  },
  {
    id: "gradient-shield",
    cat: "gradient",
    order: 14,
    color: "#c9a36e",
    level: "C",
    name: l("梯度主动屏蔽与功放接口", "Gradient Active Shield & Amplifier Interface"),
    subtitle: l("涡流抑制与电流馈入", "Eddy-current reduction & current feed"),
    structure: l(
      "在梯度主绕组外侧布置反向绕组与导电屏蔽结构，连接梯度功放、滤波器、冷却歧管与接地系统。",
      "Reverse windings and conductive shielding outside the primary gradients interface with gradient amplifiers, filters, cooling manifolds and grounding."
    ),
    principle: l(
      "主动梯度屏蔽减小梯度场向低温恒温器与外部空间的耦合，降低涡流。它不改变预期的成像梯度，而是改善其时间响应和空间选择性。",
      "Active gradient shielding reduces coupling to the cryostat and external structures, lowering eddy currents. It improves temporal response and spatial confinement rather than changing the intended imaging gradient."
    ),
    material: l("铜屏蔽导体、GFRP 结构、环氧灌封、功放铜排/水冷接口", "Copper shield conductors, GFRP structure, epoxy, busbars and water-cooled interfaces"),
    specs: [
      { k: l("功能", "Function"), v: l("抑制涡流", "eddy-current reduction") },
      { k: l("接口", "Interface"), v: l("梯度功放 + 冷却", "gradient amp + cooling") },
      { k: l("性质", "Nature"), v: l("电阻性脉冲系统", "resistive pulsed system") },
    ],
    relations: ["gradient-assembly", "electronics-racks", "ovv"],
    impact: l(
      "屏蔽不足会造成涡流、梯度波形失真、图像重影与空间编码误差；冷却不足可能触发热保护。",
      "Insufficient shielding causes eddy currents, distorted gradient waveforms, ghosting and encoding error; inadequate cooling can trigger thermal protection."
    ),
    safety: l(
      "功放输出端存在高电压/大电流。维护前必须断开能量源并确认冷却回路无压力。",
      "Amplifier outputs carry high voltage and current. Isolate energy sources and verify cooling-loop pressure before maintenance."
    ),
    refs: ["ismrm", "canon"],
    anchor: [-0.35, 0.05, 0.35],
    labelPriority: 3,
    home: [0, 0, 0],
    explode: [0.0, 0.1, 2.25],
    ghost: true,
    maxGhost: 0.35,
  },
  {
    id: "shim-system",
    cat: "shim",
    order: 15,
    color: "#e2ce7e",
    level: "B",
    name: l("被动与主动匀场系统", "Passive & Active Shim System"),
    subtitle: l("B0 局部均匀度校正", "Local B0 homogeneity correction"),
    structure: l(
      "被动铁磁垫片托盘沿孔径分布，主动匀场线圈由低功率电流源供电，二者共同改善等中心附近 B0 均匀度。",
      "Passive ferromagnetic shim trays are distributed around the bore and active shim coils are driven by low-power supplies; together they improve B0 homogeneity near isocentre."
    ),
    principle: l(
      "被动垫片按其磁化贡献校正静态场；主动匀场线圈产生低阶空间场分量（如线性/二次项）。匀场不能完全消除患者组织磁化率带来的动态不均匀性。",
      "Passive shims correct the static field via their magnetisation; active shim coils generate low-order spatial terms. Shimming cannot fully remove patient-specific susceptibility effects."
    ),
    material: l("低碳钢/铁磁垫片、铜匀场线圈、托盘、低功率电源连接", "Low-carbon steel shims, copper shim coils, trays, low-power supply links"),
    specs: [
      { k: l("被动匀场", "Passive"), v: l("铁磁垫片托盘", "ferromagnetic trays") },
      { k: l("主动匀场", "Active"), v: l("低阶线圈", "low-order coils") },
      { k: l("边界", "Limitation"), v: l("动态/患者相关场仍存在", "dynamic/patient field remains") },
    ],
    relations: ["gradient-assembly", "body-rf-coil", "helium-vessel"],
    impact: l(
      "改善 B0 均匀度有助于减少化学位移、脂肪抑制失败、EPI 几何畸变和信号丢失；患者进入后仍可能重新失谐。",
      "Improved B0 homogeneity reduces chemical-shift, fat-suppression failure, EPI distortion and signal dropout; patient loading can still create new inhomogeneity."
    ),
    safety: l(
      "被动垫片在强场中受到力。维护时必须遵循受控的磁体服务程序，不得携带工具进入孔内。",
      "Passive shims experience forces in the strong field. Maintenance must follow controlled magnet-service procedures; never bring tools into the bore."
    ),
    refs: ["ismrm", "larson"],
    anchor: [0.35, 0.18, -0.5],
    labelPriority: 4,
    home: [0, 0, 0],
    explode: [-1.85, 1.2, 0.6],
    ghost: false,
  },
  {
    id: "body-rf-coil",
    cat: "rf",
    order: 16,
    color: "#a78bfa",
    level: "B",
    name: l("体部 Birdcage 发射线圈", "Body Birdcage Transmit Coil"),
    subtitle: l("B1+ 发射 · 典型 16 腿结构", "B1+ transmit · typical 16-rung structure"),
    structure: l(
      "位于患者孔径内衬附近的鸟笼线圈，由多根纵向 rung、端环、电容与馈电点构成。本页显示 16 腿、正交馈电的教学构型。",
      "A birdcage transmitter near the patient-bore liner, built from longitudinal rungs, end rings, capacitors and feed points. This page shows a 16-rung, quadrature-fed teaching configuration."
    ),
    principle: l(
      "RF 电流在横向平面产生旋转 B1 场，用于激发氢质子。发送效率与场均匀性以 B1+ 描述；接收灵敏度是另一个物理量 B1−。",
      "RF currents generate a rotating transverse B1 field that excites protons. Transmit efficiency and homogeneity are described by B1+; receive sensitivity is a distinct quantity, B1−."
    ),
    material: l("铜/镀银铜导体、高 Q 电容、GFRP 支撑、RF 连接器", "Copper or silver-plated conductor, high-Q capacitors, GFRP support, RF connectors"),
    specs: [
      { k: l("结构", "Structure"), v: l("16 腿鸟笼 (示意)", "16-rung birdcage (schematic)") },
      { k: l("场", "Field"), v: l("B1+ 横场", "B1+ transverse field") },
      { k: l("3T Larmor", "3T Larmor"), v: "≈ 127.73 MHz" },
    ],
    relations: ["head-coil", "rf-shield", "gradient-gz", "electronics-racks"],
    impact: l(
      "B1+ 不均匀会产生翻转角误差、信号阴影与 SAR 热点；线圈失谐会降低发送效率。",
      "B1+ inhomogeneity causes flip-angle error, signal shading and SAR hotspots; coil detuning reduces transmit efficiency."
    ),
    safety: l(
      "RF 能量可导致组织加热（SAR）。高导电物体、导线环与植入物会产生局部 RF 场增强和灼伤风险。",
      "RF energy can heat tissue (SAR). Conductive loops, leads and implants can concentrate RF fields and create burn hazards."
    ),
    refs: ["rsna", "ismrm", "larson"],
    anchor: [0.3, 0.25, 0.38],
    labelPriority: 9,
    home: [0, 0, 0],
    explode: [0, 0.1, 2.8],
    ghost: false,
  },
  {
    id: "rf-shield",
    cat: "rf",
    order: 17,
    color: "#7a69d8",
    level: "B",
    name: l("RF 屏蔽层", "RF Shield"),
    subtitle: l("体线圈与梯度之间的 RF 边界", "RF boundary between body coil and gradients"),
    structure: l(
      "围绕体部 RF 线圈的薄导电屏蔽层，包含轴向缝隙与端部连接，用于减少 RF 向梯度线圈和低温结构的泄漏。",
      "A thin conductive screen around the body RF coil with axial seams and end connections, reducing RF leakage toward gradients and cryogenic structures."
    ),
    principle: l(
      "在高频下利用趋肤效应形成低阻抗 RF 边界，抑制辐射损耗、外部干扰与涡流。它不是主磁场屏蔽，也不是扫描室 Faraday 笼。",
      "At RF frequencies the skin effect creates a low-impedance boundary that limits radiation loss, external interference and eddy currents. It is neither a B0 shield nor the room Faraday cage."
    ),
    material: l("铜/铝箔或导电涂层、介质衬底、断续缝与接地", "Copper/aluminium foil or conductive coating, dielectric substrate, segmented seams and grounding"),
    specs: [
      { k: l("作用域", "Scope"), v: l("RF 近场", "RF near field") },
      { k: l("不是", "Not"), v: l("B0 屏蔽 / 扫描室笼", "B0 shield / room cage") },
      { k: l("关键设计", "Key design"), v: l("缝隙与接地", "seams and grounding") },
    ],
    relations: ["body-rf-coil", "gradient-assembly", "rf-room"],
    impact: l(
      "屏蔽不当会降低线圈 Q、增加噪声、产生驻波/阴影，并可能形成 RF 泄漏与灼伤风险。",
      "Poor shielding can reduce coil Q, add noise, create standing-wave shading and produce RF leakage with burn risk."
    ),
    safety: l(
      "RF 屏蔽接地点必须受控。维护时不得接入未经验证的导线或临时金属结构。",
      "RF shield grounding must be controlled. Do not attach unqualified wires or temporary metal structures during service."
    ),
    refs: ["rsna", "ismrm"],
    anchor: [0.34, -0.22, 0.2],
    labelPriority: 4,
    home: [0, 0, 0],
    explode: [1.15, 0.75, 3.1],
    ghost: true,
    maxGhost: 0.3,
  },
  {
    id: "head-coil",
    cat: "rf",
    order: 18,
    color: "#53e3c4",
    level: "B",
    name: l("8 通道头部接收阵列", "8-Channel Head Receive Array"),
    subtitle: l("B1− 接收 · 并行采集示例", "B1− receive · parallel-acquisition example"),
    structure: l(
      "以贴合头部的多通道接收阵列为例：多个重叠环形/鞍形线圈单元、低噪声前置放大器、失谐保护、支撑壳体与线缆接口。",
      "A close-fitting multi-channel receive array example with overlapping loop/saddle elements, low-noise preamplifiers, detuning protection, a support shell and cabling interface."
    ),
    principle: l(
      "接收线圈不向患者“发射”RF；它通过 B1− 灵敏度感应旋磁化产生的磁通。重叠可降低相邻线圈互感，通道的空间敏感度差异是并行成像的基础。",
      "Receive coils do not transmit RF into the patient; they sense magnetic flux from precessing magnetisation through B1− sensitivity. Overlap reduces mutual inductance; differing channel sensitivities underpin parallel imaging."
    ),
    material: l("铜箔/柔性导体、低损耗介质、PEEK 外壳、PGA、RF 陷波与偏置电路", "Copper/flex conductor, low-loss dielectric, PEEK shell, PGA, traps and bias circuits"),
    specs: [
      { k: l("教学配置", "Teaching config"), v: l("8 通道头部阵列", "8-channel head array") },
      { k: l("功能", "Function"), v: l("接收 B1−", "receive B1−") },
      { k: l("并行前提", "Parallel premise"), v: l("通道敏感度差异", "distinct coil sensitivities") },
    ],
    relations: ["patient-table", "body-rf-coil", "electronics-racks"],
    impact: l(
      "阵列线圈 SNR 高、可提高空间分辨率或加速采集；单元失效、重叠错误或去耦不足会造成 SNR 下降和重建伪影。",
      "Array coils improve SNR and enable higher resolution or acceleration; failed elements, poor overlap or inadequate decoupling reduce SNR and cause reconstruction artefacts."
    ),
    safety: l(
      "线圈在发射期必须可靠失谐；电缆与导电环可能造成 RF 灼伤。患者与线圈之间的隔离与监护必须符合 MR 条件。",
      "Coils must detune reliably during transmission; cables and loops can cause RF burns. Patient-coil spacing and MR-conditional monitoring are essential."
    ),
    refs: ["rsna", "larson", "ismrm"],
    anchor: [0.0, 0.1, 0.2],
    labelPriority: 8,
    home: [0, 0, 0],
    explode: [-1.35, 0.2, 3.4],
    ghost: false,
  },
  {
    id: "electronics-racks",
    cat: "electronics",
    order: 19,
    color: "#aab8c3",
    level: "C",
    name: l("功放、谱仪与控制机柜", "Amplifier, Spectrometer & Control Racks"),
    subtitle: l("设备间电子系统", "Equipment-room electronics"),
    structure: l(
      "包含梯度功放、RF 功放、发射/接收切换、谱仪/序列控制器、ADC、时钟与冷却歧管。机柜通常位于设备间，而非扫描室。",
      "Includes gradient amplifiers, RF power amplifier, transmit/receive switch, spectrometer/sequence controller, ADC, clocks and cooling manifolds. Racks normally sit in the equipment room, not the scan room."
    ),
    principle: l(
      "谱仪产生数字波形并同步梯度、RF 与 ADC；功放把低电平信号放大后通过滤波/波导进入扫描室。时钟与触发同步是前级链路的基础。",
      "The spectrometer generates waveforms and synchronises gradients, RF and ADC. Amplifiers scale low-level signals that enter the scan room through filters/waveguides. Clock and trigger synchronisation are fundamental."
    ),
    material: l("19 英寸机架、铜排/功放模块、射频屏蔽机箱、光纤与同轴连接", "19-inch racks, busbars and amplifier modules, RF-shielded chassis, fibre and coaxial links"),
    specs: [
      { k: l("典型位置", "Typical location"), v: l("设备间", "equipment room") },
      { k: l("同步", "Synchronisation"), v: l("10 MHz/触发", "10 MHz/trigger"), note: l("典型概念", "typical concept") },
      { k: l("边界", "Boundary"), v: l("穿墙滤波/波导", "penetration filters/waveguides") },
    ],
    relations: ["gradient-assembly", "body-rf-coil", "operator-console", "rf-room"],
    impact: l(
      "时序误差会直接影响梯度/RF 对齐、k-space 采样和图像质量。功放不稳定会产生条纹和 SNR 下降。",
      "Timing errors directly affect gradient/RF alignment, k-space sampling and image quality. Amplifier instability causes stripes and SNR loss."
    ),
    safety: l(
      "功放机柜存在高电压、储能电容和强水流。设备间应有受控访问与断电挂牌程序。",
      "Amplifier racks contain high voltage, stored energy and coolant. Equipment rooms require controlled access and lock-out/tag-out procedures."
    ),
    refs: ["ismrm", "canon"],
    anchor: [0, 0.8, 0.1],
    labelPriority: 4,
    home: [3.02, 0, -1.0],
    explode: [0.6, 0, 0.9],
    ghost: false,
    room: "equipment",
  },
  {
    id: "operator-console",
    cat: "electronics",
    order: 20,
    color: "#c5d2db",
    level: "C",
    name: l("重建工作站与操作台", "Reconstruction Workstation & Console"),
    subtitle: l("控制室流程与图像重建", "Control-room workflow and reconstruction"),
    structure: l(
      "操作台包含序列选择、扫描确认、重建与阅片显示。通常位于控制室，与设备间机柜分离。",
      "The console provides sequence selection, scan confirmation, reconstruction and review. It normally resides in the control room, separated from the equipment room."
    ),
    principle: l(
      "原始 k-space 数据经重建、校正和后处理生成图像。操作台还负责确认 MR 安全筛查、患者数据和扫描协议。",
      "Raw k-space data are reconstructed, corrected and post-processed into images. The console also confirms MR safety screening, patient data and protocols."
    ),
    material: l("显示器、工作站、键盘、语音对讲、无磁/非磁环境设备", "Displays, workstation, keyboard, intercom, MR-compatible or out-of-room equipment"),
    specs: [
      { k: l("位置", "Location"), v: l("控制室", "control room") },
      { k: l("输入", "Input"), v: l("原始 k-space / 元数据", "raw k-space / metadata") },
      { k: l("输出", "Output"), v: l("DICOM + 质控", "DICOM + QA") },
    ],
    relations: ["electronics-racks", "head-coil"],
    impact: l(
      "重建与校正算法决定图像呈现；不正确的协议或安全筛查可能影响诊断与患者安全。",
      "Reconstruction and correction influence the final image; incorrect protocols or safety screening can affect diagnosis and patient safety."
    ),
    safety: l(
      "操作台应能清楚观察扫描室并对讲。扫描室门控、紧急停机和失超应急流程必须明确。",
      "The console must allow clear view and communication into the scan room. Door controls, emergency stop and quench procedures must be explicit."
    ),
    refs: ["canon", "nibib"],
    anchor: [0, 0.75, 0.1],
    labelPriority: 3,
    home: [3.85, 0, -1.85],
    explode: [0.35, 0, 0.75],
    ghost: false,
    room: "control",
  },
  {
    id: "rf-room",
    cat: "electronics",
    order: 21,
    color: "#6f8190",
    level: "B",
    name: l("RF 屏蔽扫描室与波导", "RF-Shielded Scan Room & Waveguides"),
    subtitle: l("Faraday cage + penetration panel", "Faraday cage + penetration panel"),
    structure: l(
      "扫描室六面连续导电屏蔽、屏蔽门、观察窗网、波导/滤波板，以及所有进入扫描室的管线接口。",
      "Continuous six-sided conductive shielding, shielded door, mesh window, waveguide/filter panels and interfaces for every service entering the room."
    ),
    principle: l(
      "Faraday cage 阻止外部 RF 进入并限制内部 RF 泄漏。它与体线圈屏蔽层不是同一结构；波导允许非 RF 工频/冷却管线穿越而截止高频。",
      "The Faraday cage excludes external RF and confines internal RF. It is not the body-coil shield. Waveguides pass non-RF services while presenting a high-pass cutoff to the RF band."
    ),
    material: l("镀锌钢板/铜箔、屏蔽门、导电窗网、蜂窝波导、滤波面板", "Galvanised steel/copper foil, shielded door, conductive window mesh, honeycomb waveguide, filter panels"),
    specs: [
      { k: l("作用", "Function"), v: l("RF 隔离", "RF isolation") },
      { k: l("典型指标", "Typical spec"), v: l("> 80–100 dB", "> 80–100 dB"), note: l("频率相关，示意", "frequency-dependent, illustrative") },
      { k: l("不承担", "Does not"), v: l("B0 屏蔽", "B0 shielding") },
    ],
    relations: ["rf-shield", "electronics-racks", "housing"],
    impact: l(
      "屏蔽泄漏会引入外部噪声、扫描器间干扰和图像伪影；门/滤波器缺陷是常见 RF 泄漏源。",
      "Leakage admits external noise, inter-scanner interference and artefacts; door seals and filters are common failure points."
    ),
    safety: l(
      "进入扫描室需遵循 MR 安全程序；RF 屏蔽不消除强磁场、低温或窒息危险。屏蔽门应有联锁。",
      "Entering the scan room requires MR safety procedures; RF shielding does not remove strong-field, cryogenic or asphyxiation hazards. Shielding doors require interlocks."
    ),
    refs: ["ismrm", "canon", "rsna"],
    anchor: [0, 1.5, 0],
    labelPriority: 2,
    home: [0, 0, 0],
    explode: [0, 1.6, 0],
    ghost: true,
    maxGhost: 0.14,
    environment: true,
  },
];

export const PART_MAP = new Map(PARTS.map((part) => [part.id, part]));

export const EXPERIMENTS = [
  {
    id: "b0",
    num: "01",
    title: l("主磁场 B0", "Main Magnetic Field B0"),
    kicker: l("静态场 · 自旋极化", "Static field · spin polarisation"),
    level: "A",
    equation: "B₀ = 1.5 T or 3.0 T  ·  direction +Z",
    summary: l(
      "超导主磁体在患者孔径内建立沿 Z 的静态 B0。B0 使质子自旋能级分裂并产生净磁化，是 MRI 的前提；它本身不进行空间编码。",
      "The superconducting magnet creates a static B0 along Z in the patient bore. B0 splits the proton spin states and creates net magnetisation; it does not itself encode spatial position."
    ),
    theory: l(
      "本实验用等长箭头和半透明等值区域表示孔径内的名义均匀场区。真实磁体需要被动/主动匀场，并存在 ppm 级空间偏差与外部杂散场。",
      "This experiment uses equal-length arrows and a translucent nominal homogeneous region. Real magnets require shimming and still have ppm-level spatial deviations and external stray fields."
    ),
    assumptions: [
      l("场线为定性教学示意，不是 Maxwell 方程数值解。", "Field arrows are qualitative teaching marks, not a numerical Maxwell solution."),
      l("有效均匀区为理想化表示；实际均匀度和 DSV 需由厂商现场 shim map 给出。", "The homogeneous region is idealised; actual homogeneity and DSV require a site shim map."),
      l("增强杂散场与患者安全边界需基于实测场图。", "Stray fields and safety boundaries must be based on measured field maps."),
    ],
    refs: ["ismrm", "larson", "nibib"],
  },
  {
    id: "larmor",
    num: "02",
    title: l("Larmor 进动", "Larmor Precession"),
    kicker: l("γ/2π · 共振频率", "γ/2π · resonance frequency"),
    level: "A",
    equation: "f₀ = (γ/2π) · B₀   ·   γ/2π ≈ 42.577 MHz/T",
    summary: l(
      "质子磁矩绕 B0 以与场强成正比的频率进动。1.5 T 对应约 63.87 MHz，3.0 T 对应约 127.73 MHz。",
      "Proton moments precess about B0 at a frequency proportional to field strength. 1.5 T gives ≈63.87 MHz and 3.0 T gives ≈127.73 MHz."
    ),
    theory: l(
      "量子力学中自旋能级由 Zeeman 效应分裂；MRI 的宏观图像使用 Bloch 方程描述净磁化。单个自旋的经典视觉化与净磁化矢量不是同一层级的对象。",
      "Quantum spin states split via the Zeeman effect; macroscopic MRI uses the Bloch equation. A classical single-spin illustration is conceptually distinct from the net magnetisation vector."
    ),
    assumptions: [
      l("动画时间被极度压缩，不是 10⁷ Hz 级真实进动速率。", "Animation time is heavily compressed and does not represent real ~10⁷ Hz precession."),
      l("忽略弛豫、局部场偏差与量子测量的细节。", "Relaxation, local-field deviations and quantum measurement details are omitted."),
    ],
    refs: ["larson", "nist", "nibib"],
  },
  {
    id: "rf",
    num: "03",
    title: l("RF 激励", "RF Excitation"),
    kicker: l("B1+ · 翻转角", "B1+ · flip angle"),
    level: "A",
    equation: "α = (γ/2π) · 2π · B₁ · τ = γ B₁ τ",
    summary: l(
      "共振 RF 脉冲沿横向产生 B1，使净磁化偏离 B0。对理想矩形、共振、无弛豫脉冲，翻转角 α 与 B1 幅度和持续时间 τ 成正比。",
      "A resonant RF pulse creates transverse B1 and tips net magnetisation away from B0. For an ideal on-resonance rectangular pulse without relaxation, α is proportional to B1 amplitude and duration τ."
    ),
    theory: l(
      "图中采用旋转坐标系：B1 沿横向轴施加，失谐为零。90° 脉冲把 M 转到横向平面；180° 脉冲反转 Mz。B1+ 是发射场效率与均匀性的量度。",
      "The diagram uses a rotating frame with on-resonance B1 applied transversely. A 90° pulse tips M into the transverse plane; a 180° pulse inverts Mz. B1+ describes transmit efficiency and homogeneity."
    ),
    assumptions: [
      l("理想矩形脉冲、完全共振、无弛豫、无 B1 不均匀、无 SAR 建模。", "Ideal rectangular pulse, perfect resonance, no relaxation, no B1 inhomogeneity and no SAR modelling."),
      l("翻转角数值由 γ B1 τ 计算；实际扫描使用选层脉冲、梯度与 B1 校准。", "Flip angle is computed from γ B1 τ; real scans use slice-selective pulses, gradients and B1 calibration."),
    ],
    refs: ["larson", "ismrm", "rsna"],
  },
  {
    id: "gradient",
    num: "04",
    title: l("梯度空间编码", "Gradient Spatial Encoding"),
    kicker: l("Gx / Gy / Gz · 等频率面", "Gx / Gy / Gz · isofrequency planes"),
    level: "A",
    equation: "B_z(x,y,z,t) ≈ B₀ + G_x(t)x + G_y(t)y + G_z(t)z",
    summary: l(
      "梯度线圈使 Bz 随空间坐标线性变化，因此局部 Larmor 频率随位置变化。等频率面垂直于所选梯度轴，是层面选择与频率编码的基础。",
      "Gradient coils make Bz vary linearly with position, so local Larmor frequency varies with location. Isofrequency planes are normal to the selected gradient axis and form the basis of slice selection and frequency encoding."
    ),
    theory: l(
      "所选梯度轴决定 Bz 的空间斜率；G 的极性反转会反转哪一侧频率升高。这里的彩色点云和等频率平面是理想线性教学模型，不是线圈磁场求解结果。",
      "The selected gradient axis defines the spatial slope of Bz; reversing G flips which side has higher frequency. The coloured point cloud and isofrequency planes are ideal linear teaching models, not solved coil fields."
    ),
    assumptions: [
      l("假设指定 FOV 内梯度线性、无涡流、无非线性、无非共振效应。", "Assumes linear gradients over the selected FOV, no eddy currents, non-linearity or off-resonance effects."),
      l("点云仅显示 ΔBz = G·r，不表示真实三维 B 矢量或梯度线圈电感场。", "The point cloud only shows ΔBz = G·r; it is not the full 3D B-vector or coil inductance field."),
    ],
    refs: ["larson", "ismrm", "canon"],
  },
  {
    id: "sequence",
    num: "05",
    title: l("脉冲序列 · GRE", "Pulse Sequence · GRE"),
    kicker: l("RF + Gx/Gy/Gz + ADC 同步", "RF + Gx/Gy/Gz + ADC synchrony"),
    level: "C",
    equation: "TR · TE · α · slice / phase / readout",
    summary: l(
      "一个基本的 Cartesian 梯度回波教学时序：RF 激发、Gz 层选、Gy 相位编码、Gx 频率编码与 ADC 读出。三维线圈高亮与时序游标同步。",
      "A basic Cartesian gradient-echo teaching timeline: RF excitation, Gz slice selection, Gy phase encoding, Gx frequency encoding and ADC readout. 3D coil highlights follow the timeline cursor."
    ),
    theory: l(
      "时序图展示逻辑关系而非厂商序列文件。Gz 在 RF 期间选层，Gy 在每 TR 改变相位编码，Gx 在读出窗内形成频率编码；点击时间轴可跳到对应状态。",
      "The diagram shows logical relationships, not a vendor sequence file. Gz selects a slice during RF, Gy increments phase encoding each TR, and Gx frequency-encodes during readout. Clicking the timeline jumps to that state."
    ),
    assumptions: [
      l("时间轴不按真实 TE/TR 比例绘制；无 spoiling、弛豫、涡流、PNS 或 SAR 模型。", "The axis is not to real TE/TR scale; spoiling, relaxation, eddy currents, PNS and SAR are not modelled."),
      l("只展示一个抽象 GRE 重复周期。", "Only an abstract GRE repetition cycle is shown."),
    ],
    refs: ["larson", "ismrm"],
  },
  {
    id: "kspace",
    num: "06",
    title: l("K-space 与重建", "K-space & Reconstruction"),
    kicker: l("Cartesian 采样 · 2D FFT · aliasing", "Cartesian sampling · 2D FFT · aliasing"),
    level: "C",
    equation: "s(kx,ky) = ∫∫ ρ(x,y) e^{-i2π(kx x + ky y)} dx dy",
    summary: l(
      "逐行 Cartesian 采样在 k-space 中填充 ky 行；将未采样行置零并进行逆 FFT 可重建图像。加速欠采样会引入混叠，而不是被无条件“补全”。",
      "Row-wise Cartesian sampling fills ky lines in k-space; zero-filling unsampled lines and inverse FFT reconstructs an image. Accelerated undersampling introduces aliasing rather than being unconditionally ‘filled in’."
    ),
    theory: l(
      "本页在数值 phantom 上执行实际 2D FFT。并行成像可以缓解混叠，但需要多通道空间变化的线圈敏感度，不能仅靠动画恢复缺失数据。",
      "This page performs a real 2D FFT on a numerical phantom. Parallel imaging can mitigate aliasing only with multi-channel spatially varying coil sensitivities; missing data are not restored by animation alone."
    ),
    assumptions: [
      l("无噪声、无弛豫、无场不均匀、无运动、无线圈敏感度加权；抑制欠采样伪影未启用。", "No noise, relaxation, off-resonance, motion or coil weighting; undersampling artefact suppression is not enabled."),
      l("逐行 Cartesian 加速只是教学示例，不代表具体临床序列。", "Row-wise Cartesian acceleration is a teaching example, not a specific clinical protocol."),
    ],
    refs: ["larson", "ismrm", "rsna"],
  },
];

export const EXPERIMENT_MAP = new Map(EXPERIMENTS.map((e) => [e.id, e]));

export const SAFETY_NOTES = [
  {
    icon: "field",
    title: l("强磁场与铁磁投射", "Strong field & projectile hazard"),
    text: l(
      "超导磁体在正常扫描时也持续处于励磁状态。铁磁工具、气瓶、轮椅、钥匙等可能被吸入孔径；5 G 线必须按实测场图控制。",
      "A superconducting magnet remains energised during normal scanning. Ferromagnetic tools, gas cylinders, wheelchairs and keys can become projectiles; control the 5 G line using a measured field map."
    ),
  },
  {
    icon: "cold",
    title: l("低温与失超", "Cryogenics & quench"),
    text: l(
      "液氦/冷头服务区温度极低；失超会快速产生大量氦气并可能造成窒息或压力危险。排放路径必须畅通，扫描室需有氧监测与应急程序。",
      "Cryogen and cold-head service areas are extremely cold. A quench can rapidly produce large helium volumes with asphyxiation and pressure hazards. Keep vent paths clear and maintain oxygen monitoring and emergency procedures."
    ),
  },
  {
    icon: "rf",
    title: l("RF 加热与导线", "RF heating & leads"),
    text: l(
      "导电环路、导线、未认证线圈和部分植入物会增强局部 SAR。去除不必要导体，使用 MR 条件设备，并遵循线圈与植入物标签。",
      "Conductive loops, leads, unapproved coils and some implants concentrate SAR. Remove unnecessary conductors, use MR-conditional devices and follow coil/implant labelling."
    ),
  },
  {
    icon: "grad",
    title: l("梯度噪声与 PNS", "Gradient noise & PNS"),
    text: l(
      "梯度切换产生洛伦兹力振动、声噪声与可能的外周神经刺激。听力保护、噪声控制和梯度安全模型是扫描协议的一部分。",
      "Gradient switching produces Lorentz-force vibration, acoustic noise and possible peripheral nerve stimulation. Hearing protection, acoustic control and gradient safety models are part of the protocol."
    ),
  },
];

export const GLOSSARY = [
  { term: "B₀", desc: l("静态主磁场；本页定义为沿 +Z 的孔径方向。", "Static main field; defined along the +Z bore axis on this page.") },
  { term: "B₁⁺ / B₁⁻", desc: l("B₁⁺ 描述发射场效率；B₁⁻ 描述接收灵敏度。二者不是同一物理量。", "B1+ describes transmit efficiency; B1− describes receive sensitivity. They are distinct.") },
  { term: "Gx / Gy / Gz", desc: l("Bz 在 x/y/z 方向的空间斜率，不是三个独立的 B0。", "Spatial slopes of Bz along x/y/z, not three independent B0 fields.") },
  { term: "isocenter", desc: l("磁体的几何等中心，也是成像坐标系原点。", "The magnet's geometric centre and the imaging coordinate origin.") },
  { term: "SAR", desc: l("Specific Absorption Rate；RF 能量在组织中的比吸收率。", "Specific Absorption Rate; RF power absorbed per mass of tissue.") },
  { term: "ADC", desc: l("模数转换；将接收到的 MR 信号数字化以形成 k-space 数据。", "Analog-to-digital conversion; digitises received MR signal for k-space.") },
  { term: "PNS", desc: l("Peripheral nerve stimulation；快速梯度切换可能诱发的刺激。", "Peripheral nerve stimulation, possible with fast gradient switching.") },
  { term: "MLI", desc: l("多层绝热；用于低温恒温器降低辐射漏热。", "Multilayer insulation used to reduce radiative heat leak in a cryostat.") },
];

export const MODEL_NOTES = {
  architecture: l(
    "通用 3.0 T 水平孔径超导 MRI 教学模型；采用低氦量、冷头再冷凝的低温架构。并非任何厂商产品的 CAD 复制，也不代表真实制造尺寸或线圈图纸。",
    "Generic 3.0 T horizontal-bore superconducting MRI teaching model using a low-helium, cryocooler-recondensing architecture. It is not a CAD copy or manufacturing drawing of any vendor product."
  ),
  geometry: l(
    "全部几何由 Three.js 在运行时参数化生成。同轴部件的轴向位置、径向包络和层级关系为教学近似；剖面由实际裁剪平面与示意截面补片共同呈现。",
    "All geometry is generated parametrically at runtime by Three.js. Axial positions, radial envelopes and layer order of coaxial parts are teaching approximations. Sections combine real clipping planes with schematic section caps."
  ),
  physics: l(
    "基本关系（Larmor、梯度编码、RF 翻转角）采用标准解析式；场线、点云、等频率面和线圈导体排布仅作定性/示意。每个实验都列出假设与忽略项。",
    "Core relations (Larmor, gradient encoding, flip angle) use standard analytic expressions. Field lines, point clouds, isofrequency planes and conductor layouts are qualitative/schematic. Assumptions and omissions are listed for each experiment."
  ),
};
