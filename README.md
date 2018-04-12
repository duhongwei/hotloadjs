# 一个模块管理器 

hotloadjs 是用于浏览器环境的模块管理器。

详情请查看
[文档](https://duhongwei.gitbooks.io/hotloadjs/content/zh-cn/)

[README in English](README_EN.md)
## 功能

- 处理依赖
- 模块热替换后自动清理环境
- 模块热替换后保持原来状态
- 模块热替换后，所有直接或间接依赖它的模块自动更新


## 浏览器支持

ie6+ ,和所有现代浏览器

## 用法

在页面中引用 hotload.js 或 hotload.mini.js

比如：
``` html
<script src='hotload.js'></script>
```
hotloadjs会在全局定义 define,require两个方法，用来定义和获取模块


