# 项目开发提示词：MRI 3D Engineering Disassembly & Physics Explorer

## 一、项目定位与总体目标

你是一支由以下专家组成的跨学科开发团队：

- MRI Physics 专家，熟悉核磁共振、磁共振成像、梯度编码、射频激励与信号采集。
- MRI Systems Engineer，熟悉临床超导 MRI 的磁体、低温、梯度、RF 和控制系统。
- Three.js / WebGL 高级图形工程师，擅长复杂参数化建模、实时渲染和三维交互。
- 科学可视化设计师，擅长将复杂工程结构及物理过程转化为准确、直观的教学界面。

**任务：开发一个完整、可运行、可交互、具有科研教学价值的 MRI 三维拆解与物理原理可视化网站。**

项目名称：

**MRI Anatomy & Physics Lab — Interactive 3D Magnetic Resonance Imaging System**

核心目标不是制作科幻风格的 MRI 模型，而是建立一套能够用于大学生、研究生、医学物理研究人员和 MRI 工程技术人员教学的交互式三维系统。

项目须同时具备：

1. 真实可信的 MRI 硬件结构及空间关系。
2. 精细的三维参数化建模。
3. 分层、逐部件的可控拆解。
4. 内部切面及半透明观察。
5. MRI 工作原理的动态演示。
6. 可查询的工程参数及部件说明。
7. 科学可信度标记与参考资料。
8. 高质量的专业科学可视化 UI。

**科学准确性优先于视觉效果，视觉效果不能以牺牲科学正确性为代价。**

---

## 二、设备基准与几何坐标

以典型现代临床 **3.0 T、水平孔径、超导全身 MRI 系统**为基准建立模型。

采用通用 MRI 工程教学模型，而非未经证实地声称复刻某个具体厂商的产品。

参考具有约 70 cm 患者孔径的临床系统，但不得把示意尺寸冒充真实设备制造尺寸。

建立统一三维坐标：

- Z：磁体孔径纵向，也是主磁场 B0 的方向。
- X：患者左右方向。
- Y：垂直方向。
- 坐标原点：磁体几何等中心（isocenter）。
- 所有部件使用统一物理尺度和参数化尺寸表。

所有部件必须具有真实且合理的相对尺寸、轴向位置、径向位置、对称关系和装配关系。

禁止为了拆解效果而随意改变部件实际安装位置。

## 三、完整 MRI 硬件参数化建模

模型必须包括以下核心子系统，并支持分别选中、隐藏、半透明、隔离、复位与拆解。

### A. 外部结构与患者定位系统

建立外部机架及以下几何结构：

- MRI 外部机壳和前后端盖
- 磁体孔径内衬（bore liner）
- 前端环形结构与检查区域
- 患者检查床、床面及驱动底座
- 检查床纵向滑轨与移动机构
- 线圈连接接口、线缆与患者定位辅助结构

外观必须具备真实工业设计特征，避免仅用一个圆柱体和几个圆环拼凑 MRI。

检查床能够沿 Z 轴进入和退出磁体，患者扫描位置与 isocenter 正确对应。

### B. 超导主磁体系统（Superconducting Magnet）

这是整个模型最重要的子系统之一，必须详细建模。

包括：

- Main superconducting magnet coil assemblies
- Active shielding magnet coils
- Superconducting windings（以典型 NbTi 技术为参考）
- Helium vessel / cryogenic enclosure
- Thermal radiation shields
- Multilayer thermal insulation
- Outer vacuum vessel
- Cryocooler / cold head
- Cryogen service connections
- Quench vent system
- Mechanical support and suspension components

通过同轴曲面、独立线圈绕组、分段圆环、连接结构和半透明结构表现复杂低温磁体内部。

重点要求：

1. 超导线圈绕组必须呈现合理的多组环形螺线管结构，而非单个发光圆环。
2. 主线圈和主动屏蔽线圈应分别建模。
3. 低温容器、热辐射屏蔽、真空容器的空间包含关系必须正确。
4. 冷头和排氦管道必须与适当的服务接口连接。
5. 不得将低温超导线圈误画在患者直接接触的室温孔径内部。
6. 现代低氦量和传统液氦浸没式磁体设计存在差异，采用某一种参考架构时必须明确说明。

支持专门的 **Cryostat Cutaway Mode**，切开部分低温容器并展示线圈、低温层及支撑结构。

### C. 梯度线圈系统（Gradient Coil Assembly）

准确展示三轴梯度系统：

**Gx、Gy、Gz**

不得把三轴梯度线圈简单表示成三个一模一样的圆柱体。

至少实现：

- Z 梯度线圈：基于 Maxwell / anti-Helmholtz 型线圈原理的示意绕组。
- X 梯度线圈：基于 Golay 型鞍形绕组的示意结构。
- Y 梯度线圈：与 X 梯度结构存在正确空间旋转关系。
- Active gradient shielding windings
- 梯度支撑结构及绝缘灌封层
- Gradient cooling channels
- Gradient power amplifier 连接关系

线圈导体应使用 Three.js 的 Curve、TubeGeometry、BufferGeometry 等方式构造真实曲线路径。

需要在合理的设计层级上展示导体走线，而不是只给圆柱表面添加贴图。

支持：

- 单独显示 Gx、Gy、Gz
- 三轴叠加展示
- 高亮线圈导体走向
- 梯度电流方向示意
- 梯度切换时的磁场变化
- 梯度线圈受洛伦兹力产生振动和噪声的原理动画

必须明确区分磁场方向、磁场强度变化和梯度方向，避免科学概念混淆。

### D. 匀场系统（Shimming System）

实现：

- Passive shim components / shim trays
- Active shim coils
- B0 inhomogeneity visualization
- 简化匀场前后磁场均匀性比较

解释 shim 系统如何改善磁体等中心附近的磁场均匀性。

注明被扫描对象的磁化率分布会引入额外的 B0 不均匀性，不能把匀场过程呈现为能够完全消除所有非均匀性。

### E. RF 发射与接收系统

分别构建发射、接收两套功能结构。

**1. Body RF Transmit Coil**

使用 Birdcage Coil 作为典型参考：

- 纵向导体（rungs）
- 两端端环（end rings）
- 电容位置示意
- RF shield
- RF feed points

几何必须体现 Birdcage 结构，不得简化为普通金属圆筒。

**2. Receive RF Coil Array**

以多通道头部接收线圈为教学实例：

- 多个独立接收线圈环路
- 头部线圈支撑壳体
- 相邻线圈的重叠与排布示意
- 接收通道与前置放大器
- RF 接收信号传输路径

默认教学配置为体线圈发射、头部阵列接收，并解释实际设备存在其他 Tx/Rx 配置。

支持查看每个接收线圈的独立通道及空间敏感度示意。

特别展示：

- B1+：RF transmit field
- B1−：Receive sensitivity
- RF excitation
- Signal reception
- Coil sensitivity
- Parallel imaging 的基本硬件前提

不得混淆 B1+ 与 B1−，也不得把接收敏感度错误表示成从线圈向患者发射的电磁波。

### F. 电子系统、控制系统与机房

建立独立的设备机柜和信号流程图，包括：

- Gradient amplifiers
- RF power amplifier
- RF preamplifiers
- Transmit/receive switching
- Spectrometer
- ADC / digitization
- Sequence controller
- Reconstruction workstation
- Cooling system
- Operator console

通过三维线缆或动态信号连接线展示各系统之间的关系。

明确区分扫描室内设备与通常位于设备间或控制室的系统。

附加展示 RF shielding / Faraday cage 的作用，不得将扫描室 RF 屏蔽结构误认为磁体内部的一层线圈。

---

## 四、核心三维交互功能

### 1. 分层拆解（Exploded View）

实现精细的、可逆的、带缓动动画的拆解效果。

用户可以：

- 一键完整拆解。
- 按子系统拆解。
- 点击单个部件执行拆出与复位。
- 使用拆解进度滑杆控制 0–100%。
- 暂停、继续和反向播放。
- 逐步显示拆解顺序。
- 在任意拆解状态自由旋转、缩放和观察。

拆解动画必须基于真实装配关系。

对于同轴嵌套组件，可以采用轴向移出加径向错位的工程展示方式，但必须保留一键恢复真实装配位置的能力。

### 2. 剖面与透视模式

提供：

- Complete Assembly
- Longitudinal Section
- Transverse Section
- Partial Cutaway
- Transparent Shell
- Exploded Assembly
- Isolated Component

特别是横截面模式，需要清晰区分患者孔径、RF 系统、梯度线圈、低温磁体结构等空间层级。

剖面应呈现实际几何截面，不允许只是通过整体透明化来伪装剖面。

### 3. 部件点击与高亮

使用 Raycaster 识别点击。

选中部件时：

- 发光描边高亮。
- 其他部件降低不透明度。
- 相机平滑聚焦。
- 弹出部件信息卡。
- 展示其在整体装配中的位置。
- 支持查看相邻组件及相互作用。

点击空白区域恢复默认选择。

### 4. 精细视角控制

支持 OrbitControls、视角复位和视角预设：

Front、Rear、Left、Right、Top、Axial Cross-section、Longitudinal Cutaway。

支持 Perspective / Orthographic Camera 切换。

支持鼠标、触摸板与触控操作，避免缩放穿模或相机进入不合理位置。

---

## 五、MRI 物理原理可视化实验室

除了硬件拆解，必须包含独立的 **MRI Physics Lab** 模式。

这部分必须使用正确的物理关系，而不是只有动画效果。

### Experiment 1：主磁场 B0

展示超导主磁体产生的纵向静磁场。

在等中心附近使用近似均匀的 B0 示意，并区分其与磁体外部杂散磁场。

显示：

- B0 = 1.5 T / 3.0 T 可切换
- 主磁场方向
- 磁体等中心
- 典型均匀场区域

任何场线、矢量图、等值面必须标明是定性示意、解析近似还是实际数值计算结果。

禁止把装饰性粒子动画标注成经过 Maxwell 方程验证的真实磁场。

### Experiment 2：Larmor Precession

交互展示核自旋磁矩在 B0 下的进动示意。

对于氢质子：

f0 = (γ/2π) × B0

其中 γ/2π 约为 42.58 MHz/T。

切换场强时，自动计算：

- 1.5 T：约 63.87 MHz
- 3.0 T：约 127.73 MHz

使用时间缩放展示进动动画，明确标记动画并非真实时间尺度。

将净磁化矢量的经典 Bloch 表述与单个量子自旋的概念区分开。

### Experiment 3：RF Excitation

展示：

- B0 方向
- 横向 B1 场
- RF 脉冲施加过程
- 净磁化矢量偏转
- 90° 和 180° 激励／翻转示意

支持控制 RF pulse duration 和 B1 amplitude。

如果用简化 Bloch 方程模拟，必须明确旋转坐标系、共振条件、理想脉冲假设，以及忽略的物理因素。

### Experiment 4：Gradient Spatial Encoding

分别展示 Gx、Gy、Gz 激活后，等中心附近纵向磁场分量的空间变化。

理想线性梯度近似：

Bz(x,y,z,t) ≈ B0 + Gx(t)x + Gy(t)y + Gz(t)z

支持：

- 调整梯度幅值
- 梯度极性反转
- 观察等频率平面
- 观察局部 Larmor frequency 改变
- 选择层面方向

必须注明这一公式是适用于指定区域的理想近似，而非完整三维磁场解。

### Experiment 5：Pulse Sequence

建立简化但逻辑正确的 MRI 时序界面。

至少包含：

- RF
- Gx
- Gy
- Gz
- ADC
- Time axis

实现一个具有明确时序的基础 Cartesian Gradient Echo（GRE）教学实验。

3D 线圈高亮、梯度场动画、ADC 采集和时序图同步运行。

在时序图上点击任意时间点，三维场景跳转到对应工作状态。

### Experiment 6：K-space & Reconstruction

增加一个基础的二维 MRI 信号编码教学模块：

- 使用程序生成简单数字 phantom。
- 展示 Cartesian k-space 的逐行采样。
- 展示梯度时序与 k-space 轨迹之间的关系。
- 通过离散傅里叶变换演示图像重建。
- 允许观察欠采样导致的混叠。

若包含并行成像示例，必须正确解释 coil sensitivity 的作用，不能仅用动画将缺失的 k-space 数据自动补齐。

教学模型可以简化，但必须列明信号模型、采样假设及忽略的物理因素。

---

## 六、用户界面设计

采用高质量深色科研仪器界面，不采用夸张的游戏化视觉。

### 布局

**顶部：** 产品标题、模式切换、场强参数、帮助、重置。

**左侧：** 可展开的 MRI Assembly Tree，按机械、磁体、梯度、匀场、RF、电子系统分类。

**中央：** 大尺寸 Three.js 3D viewport，为主要视觉区域。

**右侧：** 当前选中部件的技术信息：

- 中文及英文名称
- 结构和安装位置
- 工程材料
- 工作原理
- 典型技术参数
- 与相邻系统的关系
- 对 MRI 成像质量的影响
- 相关安全问题
- 参考资料与可信度标记

**底部：** 拆解时间轴、透明度、剖面位置、动态演示控制器。

### 风格

背景使用深灰、黑蓝及低对比度工程网格。

不同物理系统采用稳定配色：

- 主磁体：冷蓝
- 梯度系统：琥珀橙
- RF 发射：紫色
- RF 接收：青绿色
- 低温系统：冰蓝
- 控制与电子系统：中性灰

这些颜色只用于分类说明，不代表真实材料颜色或磁场方向。

启用适度的环境光、金属材质、透明材质、阴影与轮廓高亮。

画面应更接近高级医学工程教学软件、科学仪器数字孪生展示平台，而不是科幻游戏。

### 细节要求

标签包含中文与英文，默认中文，支持英文切换。

标注引导线必须准确连接到对应部件。

避免文字相互遮挡、标签穿模，以及拆解后标签仍停留在原位置的问题。

提供操作引导、术语解释及教学步骤。

---

## 七、科学可信度要求

本项目的优先级如下：

**物理正确性 > 工程结构正确性 > 信息可追溯性 > 交互完整性 > 视觉表现。**

建立严格的科学可信度机制：

### Level A：有明确文献依据

例如主磁体、梯度、RF 的基本空间关系、工作机理及 Larmor 关系。

### Level B：典型工程结构

例如以公开资料还原的线圈、冷却通道、屏蔽绕组和低温系统。

必须注明采用了哪一种典型架构。

### Level C：教学示意或简化模型

例如简化导线排布、场线、电子机柜布局、部分材料厚度。

必须直接标记为 Schematic / Illustrative，不得假装拥有真实商业系统的制造图纸。

### 明确禁止

- 编造某一厂商的精确线圈尺寸或内部 CAD 结构。
- 把 RF 线圈、梯度线圈和主磁体线圈混为一谈。
- 错误表现 B0 与 B1 的方向关系。
- 将超导主磁体表现为只在扫描时才通电。
- 将正常扫描过程表现为液氦持续向室外大量排放。
- 把梯度场强度、梯度切换率和主磁场强度混用。
- 把没有求解依据的粒子效果宣称为真实磁场仿真。
- 使用未经来源验证的医疗设备参数。
- 为了视觉效果任意调换物理结构的内外关系。

磁体停机、失超、RF 加热、梯度噪声及外部铁磁物体风险应在安全教学面板中准确描述。

---

## 八、技术实现规范

**只允许使用 Three.js、HTML、CSS 和原生 JavaScript。**

不得使用 React、Vue、Unity、Blender 导出模型或其他三维模型加载方案。

禁止使用：

- GLTF、GLB、OBJ、FBX 等外部模型。
- 外部预制的 MRI 三维资产。
- 预渲染视频代替实时三维交互。
- 固定图片伪装三维结构。
- 其他三维渲染框架。

所有 MRI 几何结构必须由 JavaScript 参数化生成。

可以使用 Three.js 内置几何、曲线、自定义 BufferGeometry、InstancedMesh、ShaderMaterial 和 Three.js 官方 addons。

代码必须模块化，建议包含：

- `main.js`：场景初始化与生命周期
- `mriGeometry.js`：整体设备几何
- `magnetSystem.js`：超导磁体和低温结构
- `gradientSystem.js`：三轴梯度线圈
- `rfSystem.js`：射频发射与接收线圈
- `electronics.js`：电子设备及连接
- `explosionController.js`：拆解和装配动画
- `physicsEngine.js`：教学物理模型
- `interaction.js`：鼠标、相机、部件选择
- `ui.js`：面板及数据显示
- `componentsData.js`：部件参数、来源及可信度

各部件必须有唯一 ID、父子关系、原始变换矩阵、拆解目标变换、显示状态和技术元数据。

拆解进度应可随机访问并可逆，不能依赖连续播放动画才能恢复正确位置。

优化几何复用、材质数量、draw calls 和 GPU 内存。

桌面浏览器优先，兼顾移动端；提供低性能模式，并防止页面缩放、视角操作造成交互冲突。

---

## 九、交付要求及开发流程

请不要只给出设计思路、伪代码、静态效果图或者部分示例。

必须交付完整可运行项目。

按照以下顺序执行：

**Stage 1 — Scientific Research & System Blueprint**

先研究 MRI 物理和公开硬件资料，建立硬件层级树、相对位置图、坐标定义及参数可信度表。

至少参考：

- ISMRM：MRI: A Systems Overview
  https://cds.ismrm.org/protected/18MProceedings/PDFfiles/E1031.html
- Principles of MRI — Peder Larson
  https://larsonlab.github.io/MRI-education-resources/MRI%20System.html
- Canon — MRI Scanners
  https://global.canon/en/technology/canon-tech/tech/mri/
- NIH/NIBIB — Magnetic Resonance Imaging
  https://www.nibib.nih.gov/science-education/science-topics/magnetic-resonance-imaging-mri
- RSNA RadioGraphics — Clinical MRI RF Coils
  https://pubs.rsna.org/radiology/doi/10.1148/rg.210110

必要时增加厂商公开手册与同行评审研究论文。

**Stage 2 — Geometry Implementation**

先完成准确的整机结构、各硬件系统、同轴关系、线圈几何和剖面效果，再进行材质和光影优化。

**Stage 3 — Interactive Disassembly**

完成部件选择、分层拆解、动画插值、透明化、隔离查看、标签同步和相机控制。

**Stage 4 — MRI Physics**

开发可运行的磁场、RF 激励、梯度编码、时序图和基本重建教学功能。

优先保证物理模型正确，不成熟的功能应标记为简化实验，而非伪装成精确仿真。

**Stage 5 — Scientific UI**

完成专业工程界面、部件清单、技术参数卡片、双语标签、教学说明和参考文献面板。

**Stage 6 — Verification & Refinement**

启动项目并进行实际浏览器测试和截图检查。

至少检查：

1. 整机正面、侧面、轴向截面及纵向截面。
2. RF、梯度、磁体及低温系统的相对位置。
3. 导体绕组形状与连接关系。
4. 全部拆解和复位动作。
5. 任意部件的点击、隐藏与高亮。
6. 数值单位、物理公式和示意范围。
7. 标签是否遮挡或错位。
8. 渲染性能、运行报错与窗口自适应。

对发现的问题直接修复，直到主要功能可用且几何结构合理。

---

## 十、最终验收标准

完成后的项目应当允许一名 MRI 专业研究生：

- 从外部观察一台完整的临床 MRI。
- 逐层拆开外壳、RF、梯度、低温磁体系统。
- 查看主要线圈的真实典型几何构造。
- 清楚理解主磁场、梯度磁场与 RF 磁场的区别。
- 理解 RF 发射与多通道信号接收的硬件基础。
- 通过同步三维场景和脉冲时序了解 MRI 编码过程。
- 查看可靠的工程参数、参考资料及模型简化说明。
- 随时恢复整机并从任意角度检查装配关系。

**验收时不能仅以“页面运行成功”作为完成标准。**

如果模型的磁体、梯度、RF、低温系统之间的物理关系不正确，即使视觉效果精美，也应视为不合格。

如果硬件拆解正确但缺失核心交互功能，也不能视为完成。

如果物理演示不满足基本 MRI 原理，必须修复，不能用漂亮动画掩盖错误。

最终目标是一套具有工程可解释性、教学可信度和高水平视觉表现的 MRI Interactive Digital Twin 教学原型，而不是普通的 3D 展示网页。

现在请按照上述要求完成实际开发、运行测试、视觉检查和交付。