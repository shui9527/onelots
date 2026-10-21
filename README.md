---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: 54c62d5cdcd5d3fe59baab2c772ed294_5a70463cccfa11f1898e525400248c00
    ReservedCode1: JROLbkefa/Gjjx1ljXM+c6DAwgH1s7toXud1wmmr+1XuvVDHBwMjCoSssl+ZzUZyOQz9vlJAuxBj0+ULtAcJ47RItlvEjX7EXoPESzP2sRJica9EndmIf9X4vxI3aYYxVVth+zw9qgGH2CZPijN0r644hvjmDuTs/C3sfN5xu5Ay7WssuB2/A3kGF1M=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: 54c62d5cdcd5d3fe59baab2c772ed294_5a70463cccfa11f1898e525400248c00
    ReservedCode2: JROLbkefa/Gjjx1ljXM+c6DAwgH1s7toXud1wmmr+1XuvVDHBwMjCoSssl+ZzUZyOQz9vlJAuxBj0+ULtAcJ47RItlvEjX7EXoPESzP2sRJica9EndmIf9X4vxI3aYYxVVth+zw9qgGH2CZPijN0r644hvjmDuTs/C3sfN5xu5Ay7WssuB2/A3kGF1M=
---

# 一签·心愿

> 把心事交给一缕清风

「一签·心愿」是一款由 TapTap Maker H5 求签游戏重写而来的独立安卓 App。以中式签筒摇签为交互核心，提供普通求签、六壬灵犀、六爻信手、每日财运等多种求签方式，并内置基于干支历法的纯 TypeScript 解签引擎。


## 项目简介

原版为 TapTap Maker 平台上的 H5 求签小游戏，本项目使用 uni-app（Vue 3 + TypeScript）将其重写为可独立安装运行的安卓 App。整套求签算法（六壬、六爻、财运签）已由 Lua/Python 原型完整移植为 TypeScript 纯函数模块，不依赖云端即可本地完成起课、装卦与断签。

## 功能特性

- **摇筒求签**：轻点签筒触发摇签动效与音效，默念心愿抽取签文
- **八大分类心愿**：今日运势 / 人际情感 / 事业学业 / 生活灵感 / 财运亨通 / 灵犀一念 / 信手拈来 / 花语知梦
- **财运每日签**：生肖送财、每日一签，按东八区日期生成当天稳定结果（72 条谶言，本地缓存 + uniCloud 云端补写）
- **灵犀一念（大六壬）**：四课三传断课，月将采用精确中气时刻口径
- **信手拈来（六爻）**：摇六爻装卦断卦，月建依据节气划分
- **我的签缘（历史记录）**：历次求签保存在本机，支持回看详情（上限 200 条）
- **玩法引导**：内置玩法说明弹窗，快速上手

## 技术栈

| 类别 | 选型 |
| --- | --- |
| 框架 | uni-app（Vue 3，`vueVersion: 3`） |
| 语言 | TypeScript（页面 `<script setup lang="ts">`） |
| 目标平台 | Android（App 端，5+ App） |
| 算法引擎 | 自研 TS 纯函数模块：六壬 / 六爻 / 财运签 / 农历干支转换 |
| 历法数据 | 内置 1900-2100 年农历数据表 + 二十四节气精确时刻表 |
| 本地存储 | uni.setStorage / uni.getStorageSync |

## 项目目录结构

```
onelots/
├── App.vue                    # 应用入口组件（全局样式、生命周期）
├── main.js                    # 入口（Vue3 createSSRApp）
├── manifest.json              # 应用配置（AppID、版本、Android 权限、图标）
├── pages.json                 # 页面路由与全局样式（navigationStyle: custom）
├── uni.scss                  # 全局 SCSS 变量
├── pages/                     # 页面
│   ├── index/index.vue        # 首页（签筒 + 八大分支选择 + 签文弹窗）
│   ├── shake/shake.vue        # 摇签页（普通/六壬/六爻 模式）
│   ├── result/result.vue      # 结果页（签文/卦象/课盘展示）
│   ├── caiyun/caiyun.vue      # 财运每日签
│   └── history/history.vue    # 历史记录
├── engine/                    # 解签算法引擎（TS 纯函数）
│   ├── lunar.ts               # 公历 → 农历/干支历转换层
│   ├── lunar-data.ts          # 农历年表 + 节气时刻数据
│   ├── liuren.ts              # 大六壬：四课三传断课
│   ├── liuyao.ts              # 六爻：装卦断卦
│   └── caiyun.ts              # 财运每日签（东八区 todayKey + PRNG）
├── data/                      # 签文与卦辞数据
│   ├── fortunes.ts            # 普通签文（权重抽取）
│   ├── liuren.ts              # 六壬断语
│   ├── liuyao.ts              # 六爻断语
│   └── caiyun.ts              # 财运 72 条谶言
├── static/                    # 静态资源
│   ├── logo.png
│   ├── audio/                 # bamboo_shake.mp3 / fortune_reveal.mp3
│   └── image/                 # 签筒图 + 分支图标
├── docs/                      # privacy.html / terms.html（隐私与服务条款）
├── androidPrivacy.json        # Android 隐私政策配置
```


## 版本记录

- **v1.0.0**（versionCode 100）：核心功能完成。摇筒求签、八大分类、六壬/六爻/财运签引擎、历史记录、玩法引导、隐私与服务条款页。

